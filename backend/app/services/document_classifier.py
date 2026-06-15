"""
AthenaCare AI — Intelligent Medical Document Classifier
Classifies uploaded documents as medical or non-medical before analysis.
Uses multi-layer NLP scoring: keyword matching + semantic similarity + structural analysis.
"""

import re
import logging
from typing import Dict, List, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ── Medical keyword taxonomy ──────────────────────────────────────────────────

MEDICAL_STRONG_KEYWORDS = {
    # Patient / clinical identifiers
    "patient name", "patient id", "patient no", "date of birth", "dob",
    "age", "sex", "gender", "ward", "bed no", "uhid", "mrn", "ip no", "op no",
    # Doctor / hospital
    "dr.", "doctor", "physician", "consultant", "surgeon", "specialist",
    "hospital", "clinic", "medical center", "health center", "nursing home",
    "department of", "unit", "ward",
    # Lab / diagnostics
    "laboratory", "lab report", "test report", "diagnostic report",
    "sample id", "specimen", "collection date", "report date",
    "reference range", "normal range", "units", "result",
    # Blood / CBC
    "hemoglobin", "hematocrit", "wbc", "rbc", "platelets", "neutrophils",
    "lymphocytes", "monocytes", "eosinophils", "basophils", "mcv", "mch",
    "mchc", "rdw", "mpv", "differential count", "complete blood count", "cbc",
    # Biochemistry
    "glucose", "creatinine", "urea", "bun", "sodium", "potassium", "chloride",
    "bicarbonate", "calcium", "phosphorus", "magnesium", "albumin", "protein",
    "bilirubin", "alt", "ast", "alp", "ggt", "ldh", "uric acid", "cholesterol",
    "triglycerides", "hdl", "ldl", "vldl", "hba1c", "tsh", "t3", "t4",
    "psa", "cea", "afp", "ca-125", "ca 19-9",
    # Radiology / imaging
    "mri", "ct scan", "x-ray", "xray", "ultrasound", "usg", "echo",
    "echocardiogram", "pet scan", "mammogram", "dexa scan", "fluoroscopy",
    "impression", "findings", "conclusion", "radiologist", "radiology",
    "contrast", "axial", "coronal", "sagittal", "t1", "t2", "flair",
    "hyperdense", "hypodense", "hyperintense", "hypointense",
    # Pathology
    "biopsy", "histopathology", "cytology", "pathology", "specimen",
    "microscopy", "gross examination", "microscopic examination",
    "malignant", "benign", "carcinoma", "adenocarcinoma", "lymphoma",
    # Cardiology
    "ecg", "ekg", "electrocardiogram", "heart rate", "rhythm", "sinus",
    "atrial", "ventricular", "ejection fraction", "ef", "lvef",
    "systolic", "diastolic", "blood pressure", "bp", "pulse",
    # Prescription / medication
    "rx", "prescription", "tablet", "capsule", "syrup", "injection",
    "mg", "ml", "dose", "dosage", "twice daily", "once daily", "bd", "od",
    "tds", "qid", "sos", "prn", "refill", "dispense",
    # Discharge / summary
    "discharge summary", "admission date", "discharge date", "diagnosis",
    "chief complaint", "history of present illness", "hpi", "past medical history",
    "physical examination", "vitals", "treatment given", "follow up",
    "advice on discharge", "condition at discharge",
    # General medical
    "clinical", "medical", "health", "disease", "disorder", "syndrome",
    "infection", "inflammation", "chronic", "acute", "bilateral", "unilateral",
    "positive", "negative", "reactive", "non-reactive", "detected", "not detected",
}

NON_MEDICAL_STRONG_KEYWORDS = {
    # Financial / invoice
    "invoice", "tax invoice", "gst", "gstin", "vat", "subtotal", "total amount",
    "amount due", "payment due", "bill to", "ship to", "purchase order",
    "po number", "invoice number", "invoice date", "due date",
    "item description", "quantity", "unit price", "discount",
    "cgst", "sgst", "igst", "hsn", "sac code",
    # Banking / transactions
    "account number", "account no", "ifsc", "swift", "iban",
    "transaction id", "transaction date", "debit", "credit",
    "bank statement", "balance", "opening balance", "closing balance",
    "cheque", "neft", "rtgs", "imps", "upi",
    # Travel / airline
    "pnr", "boarding pass", "flight number", "seat number", "gate",
    "departure", "arrival", "airline", "airways", "terminal",
    "booking reference", "e-ticket", "itinerary",
    # Identity documents
    "aadhaar", "aadhar", "pan card", "passport number", "visa",
    "driving license", "voter id", "ration card",
    # Utility / bills
    "electricity bill", "water bill", "gas bill", "internet bill",
    "mobile bill", "telephone bill", "meter reading", "units consumed",
    # Shopping / retail
    "receipt", "cash memo", "order id", "order number", "product",
    "sku", "barcode", "mrp", "selling price", "return policy",
    # Legal
    "agreement", "contract", "deed", "affidavit", "notary",
    "legal notice", "court", "plaintiff", "defendant",
}

# Structural medical patterns (regex)
MEDICAL_PATTERNS = [
    r'\b\d+\.?\d*\s*(mg/dL|g/dL|mmol/L|U/L|IU/L|mEq/L|ng/mL|pg/mL|µg/dL|%)\b',
    r'\b(H|L|HIGH|LOW|ABNORMAL|CRITICAL|NORMAL)\b',
    r'\bRef(?:erence)?\s*(?:Range|Value|Interval)\s*:?\s*[\d\.\-\s]+',
    r'\b\d{1,3}/\d{1,3}\s*mmHg\b',  # Blood pressure
    r'\bBP\s*:?\s*\d{2,3}/\d{2,3}\b',
    r'\bPulse\s*:?\s*\d{2,3}\s*(?:bpm|/min)\b',
    r'\bTemp(?:erature)?\s*:?\s*\d{2,3}\.?\d*\s*[°℃℉F]\b',
    r'\bSpO2\s*:?\s*\d{2,3}\s*%\b',
    r'\bRx\b|\bℛ\b',  # Prescription symbol
    r'\bDr\.?\s+[A-Z][a-z]+\b',  # Doctor name
    r'\b(?:UHID|MRN|IP|OP)\s*(?:No\.?|#|:)\s*\w+\b',
    r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b.*(?:DOB|Date of Birth|D\.O\.B)',
]

NON_MEDICAL_PATTERNS = [
    r'\bGSTIN\s*:?\s*\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b',
    r'\bPNR\s*:?\s*[A-Z0-9]{6,10}\b',
    r'\bA/C\s*(?:No\.?|#)\s*\d{9,18}\b',
    r'\bIFSC\s*:?\s*[A-Z]{4}0[A-Z0-9]{6}\b',
    r'\bInvoice\s*(?:No\.?|#|:)\s*\w+\b',
    r'\bFlight\s*:?\s*[A-Z]{2}\d{3,4}\b',
    r'\bSeat\s*:?\s*\d{1,3}[A-Z]\b',
]


@dataclass
class ClassificationResult:
    is_medical: bool
    confidence: float
    document_type: str
    medical_score: float
    non_medical_score: float
    detected_indicators: List[str]
    rejection_reason: str = ""


class MedicalDocumentClassifier:
    """
    Multi-layer document classifier.
    Layer 1: Strong keyword scoring
    Layer 2: Regex pattern matching
    Layer 3: Structural analysis
    Layer 4: Confidence thresholding
    """

    def __init__(self):
        self.zero_shot_classifier = None
        self._try_load_zero_shot()

    def _try_load_zero_shot(self):
        """Zero-shot disabled on Render Free Tier to prevent OOM crash"""
        logger.warning("Zero-shot classifier disabled to prevent OOM. Using rule-based classification.")
        self.zero_shot_classifier = None

    def _normalize_text(self, text: str) -> str:
        """Normalize text for analysis"""
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _score_keywords(self, text: str) -> Tuple[float, float, List[str], List[str]]:
        """Score medical vs non-medical keywords"""
        normalized = self._normalize_text(text)
        words = set(re.findall(r'\b\w+(?:\s+\w+)?\b', normalized))

        medical_hits = []
        non_medical_hits = []

        # Check multi-word phrases first
        for phrase in MEDICAL_STRONG_KEYWORDS:
            if phrase in normalized:
                medical_hits.append(phrase)

        for phrase in NON_MEDICAL_STRONG_KEYWORDS:
            if phrase in normalized:
                non_medical_hits.append(phrase)

        # Weight: unique hits matter more than total
        medical_score = min(len(set(medical_hits)) / 8.0, 1.0)
        non_medical_score = min(len(set(non_medical_hits)) / 5.0, 1.0)

        return medical_score, non_medical_score, medical_hits, non_medical_hits

    def _score_patterns(self, text: str) -> Tuple[float, float]:
        """Score regex pattern matches"""
        medical_matches = sum(
            1 for p in MEDICAL_PATTERNS if re.search(p, text, re.IGNORECASE)
        )
        non_medical_matches = sum(
            1 for p in NON_MEDICAL_PATTERNS if re.search(p, text, re.IGNORECASE)
        )

        medical_score = min(medical_matches / 4.0, 1.0)
        non_medical_score = min(non_medical_matches / 2.0, 1.0)

        return medical_score, non_medical_score

    def _detect_document_type(self, text: str, medical_hits: List[str]) -> str:
        """Detect specific document type"""
        normalized = self._normalize_text(text)

        type_indicators = {
            "Blood Test Report": ["hemoglobin", "wbc", "rbc", "platelets", "cbc", "complete blood count", "hematocrit"],
            "Biochemistry Report": ["glucose", "creatinine", "cholesterol", "triglycerides", "alt", "ast", "bilirubin", "urea"],
            "MRI Report": ["mri", "magnetic resonance", "t1", "t2", "flair", "axial", "coronal", "sagittal"],
            "CT Scan Report": ["ct scan", "computed tomography", "contrast", "hyperdense", "hypodense"],
            "X-Ray Report": ["x-ray", "xray", "radiograph", "chest pa", "bone", "fracture", "opacity"],
            "ECG Report": ["ecg", "ekg", "electrocardiogram", "sinus rhythm", "heart rate", "pr interval", "qrs"],
            "Echocardiogram": ["echo", "echocardiogram", "ejection fraction", "lvef", "systolic", "diastolic"],
            "Prescription": ["rx", "tablet", "capsule", "mg", "dose", "twice daily", "once daily", "bd", "od"],
            "Discharge Summary": ["discharge summary", "admission date", "discharge date", "diagnosis", "treatment given"],
            "Pathology Report": ["biopsy", "histopathology", "cytology", "microscopy", "malignant", "benign"],
            "Radiology Report": ["ultrasound", "usg", "impression", "findings", "radiologist"],
            "Thyroid Report": ["tsh", "t3", "t4", "thyroid"],
            "Lipid Profile": ["cholesterol", "triglycerides", "hdl", "ldl", "vldl", "lipid"],
            "Diabetes Panel": ["hba1c", "glucose", "insulin", "diabetes"],
            "Urine Report": ["urine", "urinalysis", "specific gravity", "protein", "glucose", "ketones", "rbc", "wbc"],
            "Doctor Consultation": ["chief complaint", "history", "examination", "diagnosis", "advice", "follow up"],
        }

        for doc_type, keywords in type_indicators.items():
            if sum(1 for kw in keywords if kw in normalized) >= 2:
                return doc_type

        if medical_hits:
            return "Medical Report"
        return "Unknown Document"

    def _zero_shot_classify(self, text: str) -> Tuple[float, float]:
        """Use transformer zero-shot classification if available"""
        if not self.zero_shot_classifier:
            return 0.5, 0.5

        try:
            # Use first 512 chars for speed
            sample = text[:512]
            result = self.zero_shot_classifier(
                sample,
                candidate_labels=["medical report", "non-medical document"],
                hypothesis_template="This document is a {}.",
            )
            labels = result["labels"]
            scores = result["scores"]
            score_map = dict(zip(labels, scores))
            return score_map.get("medical report", 0.5), score_map.get("non-medical document", 0.5)
        except Exception as e:
            logger.warning(f"Zero-shot classification error: {e}")
            return 0.5, 0.5

    def classify(self, text: str) -> ClassificationResult:
        """
        Main classification pipeline.
        Returns ClassificationResult with is_medical flag and confidence.
        """
        if not text or len(text.strip()) < 20:
            return ClassificationResult(
                is_medical=False,
                confidence=0.99,
                document_type="Empty or unreadable document",
                medical_score=0.0,
                non_medical_score=0.0,
                detected_indicators=[],
                rejection_reason="Document appears to be empty or could not be read.",
            )

        # Layer 1: Keyword scoring
        kw_medical, kw_non_medical, medical_hits, non_medical_hits = self._score_keywords(text)

        # Layer 2: Pattern scoring
        pat_medical, pat_non_medical = self._score_patterns(text)

        # Layer 3: Zero-shot (if available)
        zs_medical, zs_non_medical = self._zero_shot_classify(text)

        # Weighted combination
        if self.zero_shot_classifier:
            final_medical = kw_medical * 0.45 + pat_medical * 0.25 + zs_medical * 0.30
            final_non_medical = kw_non_medical * 0.45 + pat_non_medical * 0.25 + zs_non_medical * 0.30
        else:
            final_medical = kw_medical * 0.60 + pat_medical * 0.40
            final_non_medical = kw_non_medical * 0.60 + pat_non_medical * 0.40

        # Hard override: strong non-medical signals
        if kw_non_medical > 0.4 or pat_non_medical >= 0.5:
            final_non_medical = max(final_non_medical, 0.85)

        # Hard override: strong medical signals
        if kw_medical > 0.5 or pat_medical >= 0.5:
            final_medical = max(final_medical, 0.80)

        # Normalize to get confidence
        total = final_medical + final_non_medical
        if total > 0:
            medical_confidence = final_medical / total
        else:
            medical_confidence = 0.5

        is_medical = medical_confidence >= 0.45
        confidence = medical_confidence if is_medical else (1 - medical_confidence)
        confidence = round(min(max(confidence, 0.50), 0.99), 3)

        doc_type = self._detect_document_type(text, medical_hits)

        if not is_medical:
            # Determine rejection reason
            if non_medical_hits:
                top_hits = list(set(non_medical_hits))[:3]
                rejection_reason = f"Document contains non-medical indicators: {', '.join(top_hits)}."
            else:
                rejection_reason = "Document does not contain sufficient medical content."
            doc_type = self._classify_non_medical_type(text)
        else:
            rejection_reason = ""

        return ClassificationResult(
            is_medical=is_medical,
            confidence=confidence,
            document_type=doc_type,
            medical_score=round(final_medical, 3),
            non_medical_score=round(final_non_medical, 3),
            detected_indicators=list(set(medical_hits))[:10] if is_medical else list(set(non_medical_hits))[:5],
            rejection_reason=rejection_reason,
        )

    def _classify_non_medical_type(self, text: str) -> str:
        """Identify what kind of non-medical document this is"""
        normalized = self._normalize_text(text)
        if any(kw in normalized for kw in ["invoice", "gst", "gstin", "tax invoice"]):
            return "Tax Invoice / Bill"
        if any(kw in normalized for kw in ["pnr", "boarding pass", "flight", "airline"]):
            return "Travel / Airline Document"
        if any(kw in normalized for kw in ["account number", "ifsc", "bank statement", "transaction"]):
            return "Bank / Financial Document"
        if any(kw in normalized for kw in ["aadhaar", "pan card", "passport", "driving license"]):
            return "Identity Document"
        if any(kw in normalized for kw in ["electricity", "water bill", "gas bill", "meter reading"]):
            return "Utility Bill"
        if any(kw in normalized for kw in ["receipt", "order id", "product", "mrp"]):
            return "Shopping Receipt"
        if any(kw in normalized for kw in ["agreement", "contract", "deed", "affidavit"]):
            return "Legal Document"
        return "Non-Medical Document"
