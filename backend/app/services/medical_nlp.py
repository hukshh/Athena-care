"""
AthenaCare AI — Medical NLP Engine
Diagnosis understanding, specialty mapping, and semantic analysis.
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ── Comprehensive disease → specialty mapping ─────────────────────────────────

DISEASE_SPECIALTY_MAP: Dict[str, Dict] = {
    # Cardiology
    "cardiology": {
        "specialty": "Cardiology",
        "keywords": [
            "heart attack", "myocardial infarction", "mi", "cardiac arrest",
            "coronary artery disease", "cad", "angina", "chest pain",
            "heart failure", "congestive heart failure", "chf",
            "arrhythmia", "atrial fibrillation", "afib", "af",
            "ventricular tachycardia", "bradycardia", "palpitations",
            "valve disease", "mitral valve", "aortic valve", "tricuspid",
            "heart valve", "valve replacement", "cabg", "bypass surgery",
            "angioplasty", "stent", "pacemaker", "defibrillator", "icd",
            "cardiomyopathy", "hypertrophic", "dilated cardiomyopathy",
            "aortic aneurysm", "aortic dissection", "peripheral artery",
            "heart transplant", "cardiac surgery", "open heart",
            "ejection fraction", "echocardiogram", "cardiac catheterization",
            "coronary", "cardiovascular", "cardiac",
        ],
        "procedures": ["CABG", "Angioplasty", "Valve Replacement", "TAVR", "Heart Transplant", "Pacemaker Implant"],
    },
    # Oncology
    "oncology": {
        "specialty": "Oncology",
        "keywords": [
            "cancer", "tumor", "tumour", "carcinoma", "adenocarcinoma",
            "lymphoma", "leukemia", "leukaemia", "melanoma", "sarcoma",
            "myeloma", "mesothelioma", "glioma", "glioblastoma",
            "breast cancer", "lung cancer", "colon cancer", "colorectal cancer",
            "prostate cancer", "ovarian cancer", "cervical cancer",
            "pancreatic cancer", "liver cancer", "stomach cancer",
            "kidney cancer", "bladder cancer", "thyroid cancer",
            "skin cancer", "bone cancer", "brain tumor", "brain tumour",
            "metastasis", "metastatic", "malignant", "malignancy",
            "chemotherapy", "radiation therapy", "radiotherapy",
            "immunotherapy", "targeted therapy", "oncology",
            "biopsy positive", "stage 1", "stage 2", "stage 3", "stage 4",
        ],
        "procedures": ["Chemotherapy", "Radiation Therapy", "Immunotherapy", "Tumor Resection", "Bone Marrow Transplant"],
    },
    # Neurology / Neurosurgery
    "neurology": {
        "specialty": "Neurology",
        "keywords": [
            "stroke", "brain stroke", "ischemic stroke", "hemorrhagic stroke",
            "tia", "transient ischemic attack", "brain bleed",
            "epilepsy", "seizure", "convulsion",
            "parkinson", "parkinsons disease", "parkinson's",
            "alzheimer", "dementia", "memory loss",
            "multiple sclerosis", "ms", "als", "motor neuron disease",
            "brain tumor", "brain tumour", "glioma", "meningioma",
            "hydrocephalus", "aneurysm", "brain aneurysm",
            "migraine", "headache", "cluster headache",
            "neuropathy", "peripheral neuropathy", "nerve damage",
            "spinal cord injury", "paralysis", "hemiplegia",
            "neurosurgery", "deep brain stimulation", "dbs",
            "cerebral palsy", "trigeminal neuralgia",
        ],
        "procedures": ["Brain Surgery", "Deep Brain Stimulation", "Aneurysm Clipping", "Epilepsy Surgery"],
    },
    # Orthopedics
    "orthopedics": {
        "specialty": "Orthopedics",
        "keywords": [
            "knee replacement", "knee surgery", "knee pain", "knee injury",
            "hip replacement", "hip surgery", "hip pain", "hip fracture",
            "shoulder replacement", "shoulder surgery", "rotator cuff",
            "spine surgery", "spinal fusion", "disc herniation", "herniated disc",
            "slipped disc", "sciatica", "back pain", "lower back pain",
            "scoliosis", "kyphosis", "lordosis", "spinal stenosis",
            "fracture", "bone fracture", "broken bone",
            "arthritis", "osteoarthritis", "rheumatoid arthritis",
            "ligament tear", "acl tear", "meniscus tear",
            "sports injury", "tendon repair", "carpal tunnel",
            "bone tumor", "osteosarcoma", "osteoporosis",
            "joint replacement", "arthroplasty",
        ],
        "procedures": ["Knee Replacement", "Hip Replacement", "Spinal Fusion", "ACL Repair", "Joint Arthroplasty"],
    },
    # Transplant
    "transplant": {
        "specialty": "Transplant",
        "keywords": [
            "liver transplant", "liver failure", "cirrhosis", "hepatic failure",
            "kidney transplant", "renal failure", "end stage renal disease", "esrd",
            "heart transplant", "lung transplant", "pancreas transplant",
            "bone marrow transplant", "stem cell transplant",
            "organ transplant", "organ failure", "dialysis",
            "hepatitis", "liver disease", "chronic kidney disease", "ckd",
        ],
        "procedures": ["Liver Transplant", "Kidney Transplant", "Heart Transplant", "Bone Marrow Transplant"],
    },
    # Gastroenterology
    "gastroenterology": {
        "specialty": "Gastroenterology",
        "keywords": [
            "crohn's disease", "crohns", "ulcerative colitis", "ibd",
            "irritable bowel", "ibs", "celiac disease",
            "gastric cancer", "stomach cancer", "esophageal cancer",
            "colon polyp", "colonoscopy", "endoscopy",
            "acid reflux", "gerd", "peptic ulcer", "gastric ulcer",
            "pancreatitis", "gallstones", "cholecystitis",
            "liver disease", "fatty liver", "nash", "nafld",
            "hepatitis b", "hepatitis c", "jaundice",
            "bowel obstruction", "appendicitis",
        ],
        "procedures": ["Colonoscopy", "Endoscopy", "Cholecystectomy", "Whipple Procedure"],
    },
    # Urology
    "urology": {
        "specialty": "Urology",
        "keywords": [
            "prostate cancer", "prostate enlargement", "bph",
            "kidney stones", "renal stones", "urinary stones",
            "bladder cancer", "bladder infection", "uti",
            "kidney cancer", "renal cell carcinoma",
            "testicular cancer", "penile cancer",
            "urinary incontinence", "overactive bladder",
            "erectile dysfunction", "vasectomy",
            "nephrectomy", "prostatectomy", "cystoscopy",
        ],
        "procedures": ["Prostatectomy", "Nephrectomy", "Cystoscopy", "Lithotripsy"],
    },
    # Ophthalmology
    "ophthalmology": {
        "specialty": "Ophthalmology",
        "keywords": [
            "cataract", "glaucoma", "macular degeneration",
            "retinal detachment", "diabetic retinopathy",
            "lasik", "laser eye surgery", "corneal transplant",
            "eye cancer", "retinoblastoma", "vision loss",
            "strabismus", "amblyopia", "lazy eye",
        ],
        "procedures": ["Cataract Surgery", "LASIK", "Retinal Surgery", "Corneal Transplant"],
    },
    # Gynecology / Obstetrics
    "gynecology": {
        "specialty": "Gynecology",
        "keywords": [
            "ovarian cancer", "cervical cancer", "uterine cancer", "endometrial cancer",
            "ovarian cyst", "endometriosis", "fibroids", "uterine fibroids",
            "hysterectomy", "myomectomy", "ivf", "infertility",
            "pcos", "polycystic ovary", "menopause", "menstrual disorder",
            "ectopic pregnancy", "miscarriage",
        ],
        "procedures": ["Hysterectomy", "Myomectomy", "IVF", "Laparoscopy"],
    },
    # Pulmonology
    "pulmonology": {
        "specialty": "Pulmonology",
        "keywords": [
            "lung cancer", "copd", "emphysema", "chronic bronchitis",
            "asthma", "pulmonary fibrosis", "interstitial lung disease",
            "pneumonia", "tuberculosis", "tb", "pleural effusion",
            "pulmonary embolism", "sleep apnea", "lung transplant",
            "bronchiectasis", "sarcoidosis",
        ],
        "procedures": ["Bronchoscopy", "Lung Biopsy", "Thoracoscopy", "Lung Transplant"],
    },
    # Endocrinology
    "endocrinology": {
        "specialty": "Endocrinology",
        "keywords": [
            "diabetes", "type 1 diabetes", "type 2 diabetes", "insulin",
            "thyroid cancer", "thyroid disease", "hypothyroidism", "hyperthyroidism",
            "goiter", "adrenal tumor", "pheochromocytoma", "cushing",
            "acromegaly", "growth hormone", "pituitary tumor",
            "parathyroid", "hyperparathyroidism", "obesity surgery",
        ],
        "procedures": ["Thyroidectomy", "Adrenalectomy", "Parathyroidectomy"],
    },
    # Dermatology
    "dermatology": {
        "specialty": "Dermatology",
        "keywords": [
            "skin cancer", "melanoma", "basal cell carcinoma", "squamous cell",
            "psoriasis", "eczema", "dermatitis", "vitiligo",
            "hair loss", "alopecia", "hair transplant",
            "acne", "rosacea", "skin infection",
        ],
        "procedures": ["Skin Biopsy", "Mohs Surgery", "Hair Transplant", "Laser Treatment"],
    },
    # Hematology
    "hematology": {
        "specialty": "Hematology",
        "keywords": [
            "leukemia", "lymphoma", "myeloma", "multiple myeloma",
            "anemia", "sickle cell", "thalassemia", "hemophilia",
            "blood cancer", "bone marrow", "stem cell",
            "thrombocytopenia", "polycythemia", "myelodysplastic",
        ],
        "procedures": ["Bone Marrow Transplant", "Blood Transfusion", "Stem Cell Therapy"],
    },
    # Plastic Surgery
    "plastic_surgery": {
        "specialty": "Plastic Surgery",
        "keywords": [
            "reconstructive surgery", "breast reconstruction",
            "burn treatment", "cleft palate", "cleft lip",
            "cosmetic surgery", "rhinoplasty", "facelift",
        ],
        "procedures": ["Reconstructive Surgery", "Breast Reconstruction", "Burn Treatment"],
    },
    # Dental
    "dentistry": {
        "specialty": "Dentistry",
        "keywords": [
            "dental implant", "tooth implant", "dental surgery",
            "jaw surgery", "oral cancer", "wisdom tooth",
            "root canal", "dental crown", "orthodontics",
        ],
        "procedures": ["Dental Implants", "Jaw Surgery", "Oral Cancer Surgery"],
    },
    # Fertility
    "fertility": {
        "specialty": "Fertility",
        "keywords": [
            "ivf", "in vitro fertilization", "infertility treatment",
            "egg freezing", "sperm donation", "surrogacy",
            "iui", "intrauterine insemination", "fertility treatment",
        ],
        "procedures": ["IVF", "IUI", "Egg Freezing", "Embryo Transfer"],
    },
}

# Flat keyword → specialty lookup for fast matching
_KEYWORD_TO_SPECIALTY: Dict[str, str] = {}
_KEYWORD_TO_CATEGORY: Dict[str, str] = {}

for category, data in DISEASE_SPECIALTY_MAP.items():
    for kw in data["keywords"]:
        _KEYWORD_TO_SPECIALTY[kw.lower()] = data["specialty"]
        _KEYWORD_TO_CATEGORY[kw.lower()] = category


@dataclass
class DiagnosisAnalysis:
    original_input: str
    detected_specialty: str
    confidence: float
    matched_keywords: List[str]
    suggested_procedures: List[str]
    is_specialty_mismatch: bool = False
    mismatch_message: str = ""
    alternative_specialties: List[str] = field(default_factory=list)


class MedicalNLPEngine:
    """
    NLP engine for understanding medical diagnoses and mapping to specialties.
    Uses keyword matching + semantic similarity + embedding-based search.
    """

    def __init__(self):
        self.embedding_model = None
        self._specialty_embeddings = {}
        self._try_load_embeddings()

    def _try_load_embeddings(self):
        """Try to load sentence transformer for semantic matching"""
        try:
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence transformer loaded for medical NLP")
        except Exception as e:
            logger.warning(f"Sentence transformer not available: {e}. Using keyword matching.")

    def _normalize(self, text: str) -> str:
        return re.sub(r'\s+', ' ', text.lower().strip())

    def _keyword_match(self, diagnosis: str) -> Tuple[str, float, List[str], str]:
        """Match diagnosis to specialty using keyword scoring"""
        normalized = self._normalize(diagnosis)
        scores: Dict[str, float] = {}
        matched: Dict[str, List[str]] = {}

        for category, data in DISEASE_SPECIALTY_MAP.items():
            hits = []
            for kw in data["keywords"]:
                if kw in normalized:
                    hits.append(kw)
                    # Longer matches score higher
                    scores[category] = scores.get(category, 0) + len(kw.split())
            if hits:
                matched[category] = hits

        if not scores:
            return "General Medicine", 0.5, [], "general"

        best_category = max(scores, key=scores.get)
        total_score = sum(scores.values())
        confidence = min(scores[best_category] / max(total_score, 1) + 0.3, 0.98)

        specialty = DISEASE_SPECIALTY_MAP[best_category]["specialty"]
        keywords_found = matched.get(best_category, [])

        return specialty, confidence, keywords_found, best_category

    def _semantic_match(self, diagnosis: str) -> Tuple[str, float]:
        """Use sentence embeddings for semantic specialty matching"""
        if not self.embedding_model:
            return None, 0.0

        try:
            import numpy as np

            # Build specialty descriptions
            specialty_texts = {
                cat: f"{data['specialty']}: {', '.join(data['keywords'][:10])}"
                for cat, data in DISEASE_SPECIALTY_MAP.items()
            }

            diag_embedding = self.embedding_model.encode(diagnosis, convert_to_numpy=True)
            spec_embeddings = self.embedding_model.encode(
                list(specialty_texts.values()), convert_to_numpy=True
            )

            # Cosine similarity
            diag_norm = diag_embedding / (np.linalg.norm(diag_embedding) + 1e-8)
            spec_norms = spec_embeddings / (np.linalg.norm(spec_embeddings, axis=1, keepdims=True) + 1e-8)
            similarities = spec_norms @ diag_norm

            best_idx = int(np.argmax(similarities))
            best_score = float(similarities[best_idx])
            best_category = list(specialty_texts.keys())[best_idx]

            return DISEASE_SPECIALTY_MAP[best_category]["specialty"], best_score
        except Exception as e:
            logger.warning(f"Semantic match error: {e}")
            return None, 0.0

    def analyze_diagnosis(self, diagnosis: str, selected_specialty: Optional[str] = None) -> DiagnosisAnalysis:
        """
        Full diagnosis analysis pipeline.
        Returns detected specialty, confidence, and mismatch warnings.
        """
        if not diagnosis or len(diagnosis.strip()) < 2:
            return DiagnosisAnalysis(
                original_input=diagnosis,
                detected_specialty="General Medicine",
                confidence=0.5,
                matched_keywords=[],
                suggested_procedures=[],
            )

        # Layer 1: Keyword matching
        kw_specialty, kw_confidence, kw_hits, kw_category = self._keyword_match(diagnosis)

        # Layer 2: Semantic matching (if available)
        sem_specialty, sem_confidence = self._semantic_match(diagnosis)

        # Combine results
        if sem_specialty and sem_confidence > 0.4:
            if sem_specialty == kw_specialty:
                # Both agree — high confidence
                final_specialty = kw_specialty
                final_confidence = min((kw_confidence + sem_confidence) / 2 + 0.1, 0.98)
            elif kw_confidence > 0.6:
                # Keyword match is strong — trust it
                final_specialty = kw_specialty
                final_confidence = kw_confidence
            else:
                # Semantic wins when keyword is weak
                final_specialty = sem_specialty
                final_confidence = sem_confidence
        else:
            final_specialty = kw_specialty
            final_confidence = kw_confidence

        # Get procedures for detected specialty
        procedures = []
        for cat, data in DISEASE_SPECIALTY_MAP.items():
            if data["specialty"] == final_specialty:
                procedures = data.get("procedures", [])
                break

        # Get alternative specialties
        alternatives = [
            data["specialty"]
            for cat, data in DISEASE_SPECIALTY_MAP.items()
            if data["specialty"] != final_specialty
            and any(kw in self._normalize(diagnosis) for kw in data["keywords"][:5])
        ][:3]

        # Check for specialty mismatch
        is_mismatch = False
        mismatch_message = ""

        if selected_specialty and selected_specialty not in ("All Specialties", ""):
            if selected_specialty != final_specialty and final_confidence > 0.55:
                is_mismatch = True
                mismatch_message = (
                    f"Your diagnosis suggests {final_specialty}, but you selected {selected_specialty}. "
                    f"We'll search for {final_specialty} hospitals for better results."
                )

        return DiagnosisAnalysis(
            original_input=diagnosis,
            detected_specialty=final_specialty,
            confidence=round(final_confidence, 3),
            matched_keywords=kw_hits[:5],
            suggested_procedures=procedures[:4],
            is_specialty_mismatch=is_mismatch,
            mismatch_message=mismatch_message,
            alternative_specialties=alternatives,
        )

    def get_specialty_for_diagnosis(self, diagnosis: str) -> str:
        """Quick helper — returns just the specialty string"""
        result = self.analyze_diagnosis(diagnosis)
        return result.detected_specialty


# Singleton
_nlp_engine: Optional[MedicalNLPEngine] = None

def get_nlp_engine() -> MedicalNLPEngine:
    global _nlp_engine
    if _nlp_engine is None:
        _nlp_engine = MedicalNLPEngine()
    return _nlp_engine
