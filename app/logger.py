import hashlib
import json
import datetime

from app.database import SessionLocal
from app.models.log_models import PromptLog, Alert


def _hash_prompt(prompt: str) -> str:
    """
    Ham prompt metnini SHA-256 ile hashler.
    Veritabanına ham metin değil, sadece hash kaydedilir. (Bölüm 9.1)
    """
    return "sha256:" + hashlib.sha256(prompt.encode()).hexdigest()


def _get_severity(risk_level: str) -> str:
    """
    risk_level → alert severity dönüşümü.
    """
    mapping = {
        "critical": "high",
        "high":     "high",
        "medium":   "medium",
        "low":      "low",
    }
    return mapping.get(risk_level, "low")


def log_entry(
    payload: dict,
    pii_result: dict,
    ethics_result: dict,
    decision: dict,
) -> None:
    """
    /send endpoint'inde çağrılır. PII, etik ve karar sonuçlarını
    prompt_logs tablosuna yazar. Gerekiyorsa alerts tablosuna da yazar.

    Bölüm 3.4 log politikası:
    - allow       → log opsiyonel (bu fonksiyon çağrılmaz)
    - warn        → log zorunlu
    - mask_and_allow → log zorunlu
    - warn_and_log   → log zorunlu + kurumsal modda alert
    - block          → log zorunlu + alert

    Args:
        payload:       Kişi 1'in internal_payload'u (user_id, session_id, prompt vs.)
        pii_result:    detect_sensitive_data() çıktısı
        ethics_result: analyze_ethics() çıktısı
        decision:      decide_action() çıktısı
    """
    db = SessionLocal()

    try:
        # ----------------------------------------------------------------
        # 1. prompt_logs tablosuna kayıt
        # ----------------------------------------------------------------
        log = PromptLog(
            session_id   = payload["session_id"],
            user_id      = payload["user_id"],
            timestamp    = datetime.datetime.utcnow(),

            # Ham metin saklanmaz, sadece hash (Bölüm 9.1)
            prompt_hash  = _hash_prompt(payload["prompt"]),
            masked_prompt= pii_result.get("masked_prompt") or payload.get("prompt"),

            # PII sonuçları
            pii_detected = json.dumps(
                pii_result.get("detected_entities", []),
                ensure_ascii=False
            ),
            pii_risk_level = pii_result.get("risk_level"),
            pii_action     = pii_result.get("recommended_action"),

            # Etik sonuçları
            ethical_violation    = ethics_result.get("policy_violation"),
            violation_category   = ethics_result.get("category"),
            violation_confidence = ethics_result.get("confidence"),

            # Final karar
            final_action      = decision["final_action"],
            final_risk_score  = decision.get("final_risk_score"),
            final_risk_level  = decision.get("final_risk_level"),
        )

        db.add(log)
        db.flush()  # log.id'yi almak için (alert'te lazım)

        # ----------------------------------------------------------------
        # 2. alerts tablosuna kayıt (Bölüm 3.4 ve 3.5)
        # warn_and_log veya block ise alert oluştur
        # ----------------------------------------------------------------
        final_action  = decision["final_action"]
        user_mode     = payload.get("user_mode", "individual")
        institution_id= payload.get("metadata", {}).get("institution_id")

        should_alert = final_action in ("block", "warn_and_log")

        if should_alert:
            # PII kaynaklı alert
            if pii_result.get("contains_sensitive_data"):
                alert = Alert(
                    prompt_log_id  = log.id,
                    user_id        = payload["user_id"],
                    institution_id = institution_id,
                    alert_type     = "pii_warning",
                    severity       = _get_severity(pii_result.get("risk_level", "low")),
                    is_reviewed    = False,
                )
                db.add(alert)

            # Etik kaynaklı alert
            if ethics_result.get("policy_violation"):
                alert = Alert(
                    prompt_log_id  = log.id,
                    user_id        = payload["user_id"],
                    institution_id = institution_id,
                    alert_type     = "ethics_violation",
                    severity       = _get_severity(ethics_result.get("risk_level", "low")),
                    is_reviewed    = False,
                )
                db.add(alert)

        db.commit()

    except Exception as e:
        db.rollback()
        raise e

    finally:
        db.close()