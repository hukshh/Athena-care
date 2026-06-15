"""
AthenaCare AI — Hospital Recommendation Engine
Multi-stage pipeline: NLP → Specialty Detection → Semantic Matching → ML Ranking
"""

import numpy as np
import logging
from typing import List, Dict, Optional, Any
from app.services.medical_nlp import get_nlp_engine, DiagnosisAnalysis

logger = logging.getLogger(__name__)


class HospitalRecommendationEngine:
    """
    Intelligent hospital recommendation pipeline:
    1. Analyze diagnosis with NLP
    2. Detect correct medical specialty
    3. Filter hospitals by specialty relevance
    4. Score each hospital with multi-factor algorithm
    5. Rank and return results
    """

    def __init__(self):
        self.embedding_model = None
        self.ranking_model = None
        self._try_load_models()

    def _try_load_models(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Embedding model loaded for recommendation engine")
        except Exception as e:
            logger.warning(f"Embedding model not available: {e}")

        try:
            import joblib, os
            path = "models/hospital_ranker.pkl"
            if os.path.exists(path):
                self.ranking_model = joblib.load(path)
                logger.info("XGBoost ranking model loaded")
        except Exception as e:
            logger.warning(f"Ranking model not available: {e}")

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        if a is None or b is None:
            return 0.5
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na == 0 or nb == 0:
            return 0.0
        return float(np.dot(a, b) / (na * nb))

    def _specialty_relevance_score(self, hospital: Dict, target_specialty: str) -> float:
        """
        Score how relevant a hospital is for the target specialty.
        Uses exact match, partial match, and keyword overlap.
        """
        h_specialty = hospital.get("specialty", "").lower()
        h_specialties = [s.lower() for s in hospital.get("specialties", [])]
        target = target_specialty.lower()

        # Exact match on primary specialty
        if h_specialty == target:
            return 1.0

        # Match in specialties list
        if target in h_specialties:
            return 0.95

        # Partial match (e.g. "Cardiology" in "Interventional Cardiology")
        if target in h_specialty or h_specialty in target:
            return 0.85

        for s in h_specialties:
            if target in s or s in target:
                return 0.80

        # Multi-specialty hospitals get partial credit
        if hospital.get("specialty", "").lower() == "multi-specialty":
            return 0.60

        # No match
        return 0.10

    def _semantic_hospital_score(self, diagnosis: str, hospital: Dict) -> float:
        """Semantic similarity between diagnosis and hospital profile"""
        if not self.embedding_model:
            return 0.5

        try:
            hospital_text = " ".join(filter(None, [
                hospital.get("name", ""),
                hospital.get("specialty", ""),
                " ".join(hospital.get("specialties", [])),
                " ".join(hospital.get("conditions_treated", [])),
                hospital.get("description", ""),
            ]))

            if not hospital_text.strip():
                return 0.5

            diag_emb = self.embedding_model.encode(diagnosis, convert_to_numpy=True)
            hosp_emb = self.embedding_model.encode(hospital_text, convert_to_numpy=True)
            return self._cosine_similarity(diag_emb, hosp_emb)
        except Exception as e:
            logger.warning(f"Semantic scoring error: {e}")
            return 0.5

    def _compute_match_score(
        self,
        hospital: Dict,
        diagnosis_analysis: DiagnosisAnalysis,
        budget: Optional[float],
        preferred_country: Optional[str],
        urgency: str,
        age: Optional[int],
    ) -> Dict[str, float]:
        """
        Compute multi-factor match score.
        Returns individual component scores and final weighted score.
        """
        target_specialty = diagnosis_analysis.detected_specialty

        # 1. Specialty relevance (most important — 35%)
        specialty_score = self._specialty_relevance_score(hospital, target_specialty)

        # 2. Semantic similarity (20%)
        semantic_score = self._semantic_hospital_score(
            diagnosis_analysis.original_input, hospital
        )

        # 3. Quality score — rating + success rate (20%)
        rating = hospital.get("rating", 4.0)
        success_rate = hospital.get("success_rate", 90.0)
        quality_score = (rating / 5.0) * 0.5 + (success_rate / 100.0) * 0.5

        # 4. Budget compatibility (10%)
        budget_score = 1.0
        if budget and budget > 0:
            cost_min = hospital.get("avg_cost_usd", {}).get("min", 0) if isinstance(hospital.get("avg_cost_usd"), dict) else 0
            cost_max = hospital.get("avg_cost_usd", {}).get("max", 999999) if isinstance(hospital.get("avg_cost_usd"), dict) else 999999
            if cost_min <= budget:
                budget_score = 1.0
            elif cost_min <= budget * 1.3:
                budget_score = 0.7
            else:
                budget_score = 0.3

        # 5. Country preference (10%)
        country_score = 1.0
        if preferred_country and preferred_country not in ("All Countries", ""):
            if hospital.get("country", "").lower() == preferred_country.lower():
                country_score = 1.0
            else:
                country_score = 0.4

        # 6. Accreditation (5%)
        accreditation = hospital.get("accreditation", "")
        accreditation_score = 1.0 if "JCI" in accreditation else 0.7 if accreditation else 0.5

        # Weighted final score
        final = (
            specialty_score * 0.35 +
            semantic_score * 0.20 +
            quality_score * 0.20 +
            budget_score * 0.10 +
            country_score * 0.10 +
            accreditation_score * 0.05
        )

        # Use XGBoost if available
        if self.ranking_model:
            try:
                features = np.array([[
                    specialty_score, semantic_score, quality_score,
                    budget_score, country_score, accreditation_score,
                    rating / 5.0, success_rate / 100.0
                ]])
                ml_score = float(self.ranking_model.predict(features)[0])
                final = final * 0.6 + ml_score * 0.4
            except Exception:
                pass

        return {
            "final": round(min(max(final, 0.0), 1.0), 4),
            "specialty": round(specialty_score, 3),
            "semantic": round(semantic_score, 3),
            "quality": round(quality_score, 3),
            "budget": round(budget_score, 3),
            "country": round(country_score, 3),
        }

    def _score_to_percentage(self, score: float, specialty_score: float) -> int:
        """
        Convert raw score to display percentage.
        Specialty score heavily influences the final display.
        """
        if specialty_score < 0.2:
            # Hospital is not relevant for this specialty
            base = int(score * 60)
        elif specialty_score >= 0.9:
            base = int(score * 100)
            base = max(base, 82)
        else:
            base = int(score * 90)
            base = max(base, 65)

        return min(max(base, 50), 99)

    def _generate_match_reasons(
        self,
        hospital: Dict,
        diagnosis_analysis: DiagnosisAnalysis,
        scores: Dict[str, float],
    ) -> List[str]:
        """Generate human-readable reasons for the match"""
        reasons = []
        target = diagnosis_analysis.detected_specialty

        if scores["specialty"] >= 0.9:
            reasons.append(f"Specialized in {target} — exact match for your diagnosis")
        elif scores["specialty"] >= 0.7:
            reasons.append(f"Strong {target} department")
        elif scores["specialty"] >= 0.5:
            reasons.append(f"Multi-specialty hospital with {target} capabilities")

        success_rate = hospital.get("success_rate", 0)
        if success_rate >= 96:
            reasons.append(f"{success_rate}% treatment success rate")
        elif success_rate >= 90:
            reasons.append(f"High success rate: {success_rate}%")

        if "JCI" in hospital.get("accreditation", ""):
            reasons.append("JCI Accredited — meets international quality standards")

        if scores["country"] >= 0.9:
            reasons.append(f"Located in your preferred country: {hospital.get('country')}")

        if scores["budget"] >= 0.9:
            reasons.append("Within your budget range")

        if hospital.get("international_patients_per_year", 0) > 500000:
            reasons.append("Extensive international patient experience")

        return reasons[:4]

    def recommend(
        self,
        diagnosis: str,
        hospitals: List[Dict],
        budget: Optional[float] = None,
        preferred_country: Optional[str] = None,
        urgency: str = "normal",
        age: Optional[int] = None,
        selected_specialty: Optional[str] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """
        Main recommendation function.
        Returns ranked hospitals with AI scores and reasoning.
        """
        if not hospitals:
            return {"recommendations": [], "diagnosis_analysis": {}, "total": 0}

        # Step 1: Analyze diagnosis
        nlp = get_nlp_engine()
        analysis = nlp.analyze_diagnosis(diagnosis, selected_specialty)

        logger.info(
            f"Diagnosis '{diagnosis}' → Specialty: {analysis.detected_specialty}, "
            f"Confidence: {analysis.confidence}, Mismatch: {analysis.is_specialty_mismatch}"
        )

        # Step 2: Score all hospitals
        scored = []
        for hospital in hospitals:
            scores = self._compute_match_score(
                hospital, analysis, budget, preferred_country, urgency, age
            )

            match_pct = self._score_to_percentage(scores["final"], scores["specialty"])
            reasons = self._generate_match_reasons(hospital, analysis, scores)

            h = hospital.copy()
            h["match_score"] = match_pct
            h["match_reasons"] = reasons
            h["score_breakdown"] = scores
            h["detected_specialty"] = analysis.detected_specialty
            scored.append(h)

        # Step 3: Sort by match score
        scored.sort(key=lambda x: (x["score_breakdown"]["final"], x.get("rating", 0)), reverse=True)

        # Step 4: Filter out very low relevance (specialty score < 0.15)
        # unless we don't have enough results
        relevant = [h for h in scored if h["score_breakdown"]["specialty"] >= 0.15]
        if len(relevant) < 3:
            relevant = scored  # fallback: return all

        results = relevant[:limit]

        return {
            "recommendations": results,
            "diagnosis_analysis": {
                "detected_specialty": analysis.detected_specialty,
                "confidence": analysis.confidence,
                "matched_keywords": analysis.matched_keywords,
                "suggested_procedures": analysis.suggested_procedures,
                "is_specialty_mismatch": analysis.is_specialty_mismatch,
                "mismatch_message": analysis.mismatch_message,
                "alternative_specialties": analysis.alternative_specialties,
            },
            "total": len(results),
            "search_specialty": analysis.detected_specialty,
        }
