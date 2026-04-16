from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider

# ---------------------------------------------------------------------------
# Entity type mapping: Presidio → PromptGuard categories (Bölüm 3.6)
# ---------------------------------------------------------------------------
ENTITY_MAPPING = {
    "PERSON": "PERSON",
    "EMAIL_ADDRESS": "EMAIL",
    "PHONE_NUMBER": "PHONE",
    "US_BANK_NUMBER": "FINANCIAL_DATA",
    "CREDIT_CARD": "FINANCIAL_DATA",
    "IBAN_CODE": "FINANCIAL_DATA",
    "DATE_TIME": "ID_NUMBER",
    "US_SSN": "ID_NUMBER",
    "US_PASSPORT": "ID_NUMBER",
    "NRP": "ID_NUMBER",
    "LOCATION": "ADDRESS",
    "ORGANIZATION": "ORGANIZATION",
    "MEDICAL_LICENSE": "HEALTH_DATA",
    "URL": "ADDRESS",
}

# ---------------------------------------------------------------------------
# Priority for resolving overlapping spans (Bölüm 5.5, Kural 4)
# Higher index = higher priority
# ---------------------------------------------------------------------------
TYPE_PRIORITY = {
    "ORGANIZATION": 0,
    "ADDRESS": 1,
    "PHONE": 2,
    "EMAIL": 3,
    "PERSON": 4,
    "HEALTH_DATA": 5,
    "FINANCIAL_DATA": 6,
    "ID_NUMBER": 7,
    "PASSWORD": 8,
}

# ---------------------------------------------------------------------------
# Risk score weights per category (0–100 scale)
# ---------------------------------------------------------------------------
RISK_WEIGHTS = {
    "PASSWORD": 100,
    "FINANCIAL_DATA": 95,
    "ID_NUMBER": 80,
    "HEALTH_DATA": 75,
    "PERSON": 40,
    "EMAIL": 40,
    "PHONE": 40,
    "ADDRESS": 30,
    "ORGANIZATION": 20,
}

# ---------------------------------------------------------------------------
# Block-level categories → recommended_action = "block" (Bölüm 3.5)
# ---------------------------------------------------------------------------
BLOCK_CATEGORIES = {"FINANCIAL_DATA", "PASSWORD"}

# ---------------------------------------------------------------------------
# Mask-and-allow categories (Bölüm 3.5)
# ---------------------------------------------------------------------------
MASK_CATEGORIES = {"PERSON", "EMAIL", "PHONE", "ADDRESS", "ID_NUMBER", "HEALTH_DATA", "ORGANIZATION"}

# ---------------------------------------------------------------------------
# Custom recognizers
# ---------------------------------------------------------------------------

# PASSWORD recognizer
# 3 farklı format yakalanıyor:
# 1. "password=abc123"  veya "şifre: abc123"  (label=value formatı)
# 2. "my password is abc123"                  (doğal dil formatı)
# 3. "şifrem abc123"                          (Türkçe doğal dil)
password_recognizer = PatternRecognizer(
    supported_entity="PASSWORD",
    patterns=[
        Pattern(
            name="password_label_format",
            regex=r"(?i)(password|passwd|pwd|şifre|parola)\s*[=:]\s*\S+",
            score=0.9,
        ),
        Pattern(
            name="password_natural_en",
            regex=r"(?i)(my\s+)?(password|passwd)\s+is\s+\S+",
            score=0.85,
        ),
        Pattern(
            name="password_natural_tr",
            regex=r"(?i)(şifrem|parolam)\s*(is|:)?\s*\S+",
            score=0.85,
        ),
    ],
)

# HEALTH_DATA recognizer
# Yaygın hastalık adları, ilaç grupları ve tıbbi terimler
health_data_recognizer = PatternRecognizer(
    supported_entity="HEALTH_DATA",
    patterns=[
        Pattern(
            name="health_condition",
            regex=(
                r"(?i)\b("
                r"diabetes|diabetic|cancer|tumor|hiv|aids|hepatitis|epilepsy|epileptic|"
                r"depression|anxiety|schizophrenia|alzheimer|parkinson|asthma|"
                r"hypertension|covid|coronavirus|tuberculosis|stroke|"
                r"diyabet|kanser|hipertansiyon|depresyon|anksiyete|astım|"
                r"şizofreni|epilepsi|felç|inme"
                r")\b"
            ),
            score=0.75,
        ),
        Pattern(
            name="health_medication",
            regex=(
                r"(?i)\b("
                r"metformin|insulin|aspirin|ibuprofen|paracetamol|amoxicillin|"
                r"chemotherapy|antidepressant|antibiotic|vaccine|"
                r"kemoterapi|antidepresan|antibiyotik|aşı|insülin"
                r")\b"
            ),
            score=0.75,
        ),
        Pattern(
            name="health_diagnosis_phrase",
            regex=r"(?i)(diagnosed with|suffering from|treated for|history of|hasta|teşhis)\s+\w+",
            score=0.70,
        ),
    ],
)

# PHONE recognizer — phonenumbers kütüphanesinin kaçırdığı formatları yakalar
# Format örnekleri: 555-123-4567 | (555) 123-4567 | 555.123.4567 | +1 555 123 4567
# Türkçe: 0532 123 45 67 | +90 532 123 45 67
phone_recognizer = PatternRecognizer(
    supported_entity="PHONE_NUMBER",
    patterns=[
        Pattern(
            name="phone_us_dashes",
            regex=r"\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b",
            score=0.75,
        ),
        Pattern(
            name="phone_us_parentheses",
            regex=r"\(\d{3}\)\s*\d{3}[-.\s]\d{4}",
            score=0.75,
        ),
        Pattern(
            name="phone_international",
            regex=r"\+\d{1,3}[\s\-]\d{2,4}[\s\-]\d{3,4}[\s\-]\d{2,4}",
            score=0.75,
        ),
        Pattern(
            name="phone_tr_mobile",
            regex=r"\b0[5][0-9]{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b",
            score=0.75,
        ),
    ],
)

# Turkish TC Kimlik No (11 digit, starting with non-zero)
tc_kimlik_recognizer = PatternRecognizer(
    supported_entity="ID_NUMBER",
    patterns=[
        Pattern(
            name="tc_kimlik",
            regex=r"\b[1-9][0-9]{10}\b",
            score=0.75,
        ),
    ],
)

# ---------------------------------------------------------------------------
# Analyzer setup
# ---------------------------------------------------------------------------
import spacy, tempfile
from presidio_analyzer.nlp_engine import NlpEngineProvider

def _build_analyzer() -> AnalyzerEngine:
    """
    Build AnalyzerEngine with a blank spaCy model (pattern-only mode).
    NER tabanlı tanıma devre dışı — yalnızca regex/pattern recognizer'lar aktif.
    Bu sayede spaCy NER'in ürettiği yanlış pozitifler (ör. sıradan kelimelerin
    PERSON olarak etiketlenmesi) tamamen önlenir.
    """
    blank_nlp = spacy.blank("en")
    tmp = tempfile.mkdtemp()
    blank_nlp.to_disk(tmp)

    provider = NlpEngineProvider(nlp_configuration={
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": "en", "model_name": tmp}],
    })
    nlp_engine = provider.create_engine()
    return AnalyzerEngine(nlp_engine=nlp_engine)


analyzer = _build_analyzer()
analyzer.registry.add_recognizer(password_recognizer)
analyzer.registry.add_recognizer(phone_recognizer)
analyzer.registry.add_recognizer(tc_kimlik_recognizer)
analyzer.registry.add_recognizer(health_data_recognizer)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_overlaps(entities: list[dict]) -> list[dict]:
    """
    Remove overlapping spans; keep highest-priority entity per span (Kural 4).
    Works on list of dicts with keys: start, end, type.
    """
    # Sort by start, then by descending priority
    entities = sorted(
        entities,
        key=lambda e: (e["start"], -TYPE_PRIORITY.get(e["type"], 0)),
    )

    resolved = []
    last_end = -1

    for entity in entities:
        if entity["start"] >= last_end:
            resolved.append(entity)
            last_end = entity["end"]
        else:
            # Overlap: keep higher priority
            if resolved:
                current_priority = TYPE_PRIORITY.get(entity["type"], 0)
                prev_priority = TYPE_PRIORITY.get(resolved[-1]["type"], 0)
                if current_priority > prev_priority:
                    resolved[-1] = entity
                    last_end = max(last_end, entity["end"])

    return resolved


def _calculate_risk(entities: list[dict]) -> tuple[int, str]:
    """
    Calculate risk_score (0-100) and risk_level (Bölüm 3.2).
    Score grows with entity count and category severity.
    """
    if not entities:
        return 0, "low"

    base_score = 0
    for entity in entities:
        weight = RISK_WEIGHTS.get(entity["type"], 20)
        base_score = max(base_score, weight)

    # Bonus for multiple entities (capped at 100)
    count_bonus = min((len(entities) - 1) * 5, 20)
    score = min(base_score + count_bonus, 100)

    if score >= 90:
        level = "critical"
    elif score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"

    return score, level


def _recommended_action(entities: list[dict]) -> str:
    """
    Determine recommended_action based on detected entity types (Bölüm 3.5).
    """
    if not entities:
        return "allow"

    types = {e["type"] for e in entities}

    if types & BLOCK_CATEGORIES:
        return "block"

    if types & MASK_CATEGORIES:
        return "mask_and_allow"

    return "allow"


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------

def detect_sensitive_data(payload: dict) -> dict:
    """
    Detect and mask PII in the given prompt.

    Args:
        payload: dict with at least a "prompt" key.

    Returns:
        dict conforming to Bölüm 5.3 output schema.
    """
    prompt = payload.get("prompt", "")

    # Run Presidio analysis — score_threshold=0.6 ile düşük güvenli yanlış pozitifleri filtrele
    analysis_results = analyzer.analyze(text=prompt, language="en", score_threshold=0.6)

    # Map entity types and collect raw entities
    raw_entities = []
    for result in analysis_results:
        mapped_type = ENTITY_MAPPING.get(result.entity_type, result.entity_type)
        raw_entities.append({
            "type": mapped_type,
            "value": prompt[result.start:result.end],
            "start": result.start,
            "end": result.end,
        })

    # Resolve overlapping spans (Kural 4)
    resolved = _resolve_overlaps(raw_entities)

    # Sort left-to-right (Kural 1 & 3 — sıra numarası)
    resolved = sorted(resolved, key=lambda e: e["start"])

    # -----------------------------------------------------------------------
    # Build labels (Bölüm 5.5 — Kurallar 1, 2, 3)
    # -----------------------------------------------------------------------
    type_counts: dict[str, int] = {}
    for entity in resolved:
        type_counts[entity["type"]] = type_counts.get(entity["type"], 0) + 1

    type_counters: dict[str, int] = {}
    detected_entities = []

    for entity in resolved:
        t = entity["type"]
        type_counters[t] = type_counters.get(t, 0) + 1

        if type_counts[t] == 1:
            label = t                          # Kural 2: tek örnek → numarasız
        else:
            label = f"{t}_{type_counters[t]}"  # Kural 1 & 3: soldan sağa numara

        detected_entities.append({
            "type": t,
            "value": entity["value"],
            "start": entity["start"],
            "end": entity["end"],
            "label": label,
        })

    # -----------------------------------------------------------------------
    # Build masked_prompt (sondan başa — index kaymasını önler)
    # -----------------------------------------------------------------------
    masked_prompt = prompt
    for entity in sorted(detected_entities, key=lambda e: e["start"], reverse=True):
        masked_prompt = (
            masked_prompt[: entity["start"]]
            + f"[{entity['label']}]"
            + masked_prompt[entity["end"] :]
        )

    # -----------------------------------------------------------------------
    # Risk scoring & recommended action
    # -----------------------------------------------------------------------
    risk_score, risk_level = _calculate_risk(detected_entities)
    action = _recommended_action(detected_entities)

    contains_pii = len(detected_entities) > 0
    warning_message = "Prompt contains sensitive personal data." if contains_pii else ""

    return {
        "module_name": "pii_detector",
        "risk_score": risk_score,
        "risk_level": risk_level,
        "contains_sensitive_data": contains_pii,
        "detected_entities": detected_entities,
        "masked_prompt": masked_prompt,
        "warning_message": warning_message,
        "recommended_action": action,
    }