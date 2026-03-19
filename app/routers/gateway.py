from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.middleware.jwt_middleware import get_current_user
from app.services.llm_service import send_to_llm
from pii_module.detector import detect_sensitive_data
from app.logger import log_entry

router = APIRouter(tags=["gateway"])


# --- Gelen veriyi tanımlayan model ---

class SendRequest(BaseModel):
    prompt: str
    session_id: str
    course_id: Optional[str] = None


# -------------------------------------------------------
# PLACEHOLDER FONKSİYONLAR
# Kişi 2 ve Kişi 3'ün modülleri hazır olunca
# bu fonksiyonlar kaldırılıp gerçekleri import edilecek
# -------------------------------------------------------

def placeholder_pii(payload: dict) -> dict:
    return {
        "module_name": "pii_detector",
        "risk_score": 0,
        "risk_level": "low",
        "contains_sensitive_data": False,
        "detected_entities": [],
        "masked_prompt": payload["prompt"],
        "warning_message": "",
        "recommended_action": "allow"
    }

def placeholder_ethics(payload: dict) -> dict:
    return {
        "module_name": "ethics_analyzer",
        "risk_score": 0,
        "risk_level": "low",
        "policy_violation": False,
        "category": "safe_usage",
        "confidence": 1.0,
        "explanation": "",
        "recommended_action": "allow"
    }

def placeholder_decide(payload: dict, pii_result: dict, ethics_result: dict) -> dict:
    return {
        "final_action": "allow",
        "final_risk_level": "low",
        "final_risk_score": 0,
        "prompt_to_send": payload["prompt"],
        "user_message": "",
        "log_required": False,
        "block_reason": None
    }


# -------------------------------------------------------
# YARDIMCI FONKSİYON: İç payload oluşturma (Bölüm 4.3)
# user_id, user_mode, institution_id her zaman
# JWT token'dan gelir — request body'den ALINMAZ
# -------------------------------------------------------

def build_internal_payload(body: SendRequest, current_user: dict) -> dict:
    return {
        "user_id": current_user["user_id"],
        "user_mode": current_user["user_mode"],
        "prompt": body.prompt,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "session_id": body.session_id,
        "metadata": {
            "institution_id": current_user["institution_id"],
            "course_id": body.course_id,
            "source": "web"
        }
    }


# -------------------------------------------------------
# ENDPOINT'LER
# -------------------------------------------------------

@router.post("/analyze")
def analyze(body: SendRequest, current_user: dict = Depends(get_current_user)):
    """
    Promptu analiz eder ama LLM'e GÖNDERMEZ.
    Kalıcı log OLUŞTURMAZ.
    Kullanıcı göndermeden önce sonucu görmek istediğinde kullanılır.
    """

    # Doğrulama
    if not body.prompt.strip():
        raise HTTPException(status_code=400,
                            detail={"error": True,
                                    "error_code": "EMPTY_PROMPT",
                                    "message": "Prompt boş olamaz"})

    # İç payload'u oluştur (JWT'den türetilir)
    internal_payload = build_internal_payload(body, current_user)

    # Modülleri çalıştır
    # TODO: Kişi 2 hazır olunca -> detect_sensitive_data(internal_payload)
    pii_result = detect_sensitive_data(internal_payload)

    # TODO: Kişi 3 hazır olunca -> analyze_ethics(internal_payload)
    ethics_result = placeholder_ethics(internal_payload)

    # TODO: Kişi 3 hazır olunca -> decide_action(internal_payload, pii_result, ethics_result)
    decision = placeholder_decide(internal_payload, pii_result, ethics_result)

    # /analyze kalıcı log oluşturmaz — sadece sonucu döner
    return {
        "pii_result": {
            "risk_level": pii_result["risk_level"],
            "risk_score": pii_result["risk_score"],
            "contains_sensitive_data": pii_result["contains_sensitive_data"],
            "masked_prompt": pii_result["masked_prompt"]
        },
        "ethics_result": {
            "risk_level": ethics_result["risk_level"],
            "risk_score": ethics_result["risk_score"],
            "policy_violation": ethics_result["policy_violation"],
            "category": ethics_result["category"]
        },
        "decision": {
            "final_action": decision["final_action"],
            "final_risk_level": decision["final_risk_level"],
            "final_risk_score": decision["final_risk_score"],
            "prompt_to_send": decision["prompt_to_send"],
            "user_message": decision["user_message"]
        }
    }


@router.post("/send")
def send(body: SendRequest, current_user: dict = Depends(get_current_user)):
    """
    Promptu analiz eder ve LLM'e gönderir.
    Kalıcı log OLUŞTURUR (warn, warn_and_log, block durumlarında).
    final_action = 'block' ise send_to_llm() ÇAĞRILMAZ.
    """

    # Doğrulama
    if not body.prompt.strip():
        raise HTTPException(status_code=400,
                            detail={"error": True,
                                    "error_code": "EMPTY_PROMPT",
                                    "message": "Prompt boş olamaz"})

    # İç payload'u oluştur (JWT'den türetilir)
    internal_payload = build_internal_payload(body, current_user)

    # Modülleri çalıştır
    # TODO: Kişi 2 hazır olunca -> detect_sensitive_data(internal_payload)
    pii_result = detect_sensitive_data(internal_payload)

    # TODO: Kişi 3 hazır olunca -> analyze_ethics(internal_payload)
    ethics_result = placeholder_ethics(internal_payload)

    # TODO: Kişi 3 hazır olunca -> decide_action(internal_payload, pii_result, ethics_result)
    decision = placeholder_decide(internal_payload, pii_result, ethics_result)

    # BLOCK kontrolü — send_to_llm() kesinlikle çağrılmaz
    if decision["final_action"] == "block":
        # TODO: Kişi 2 hazır olunca log kaydı buraya eklenecek
        raise HTTPException(status_code=403,
                            detail={"error": True,
                                    "error_code": "PROMPT_BLOCKED",
                                    "message": decision["user_message"],
                                    "block_reason": decision["block_reason"]})

    # LLM'e gönder
    llm_result = send_to_llm(
        session_id=body.session_id,
        prompt=decision["prompt_to_send"],
        user_mode=current_user["user_mode"]
    )

    # TODO: Kişi 2 hazır olunca log kaydı buraya eklenecek
    # (warn, warn_and_log durumlarında log_required = True)
    if decision["log_required"]:
        log_entry(
            payload=internal_payload,
            pii_result=pii_result,
            ethics_result=ethics_result,
            decision=decision
        )

    return {
        "final_action": decision["final_action"],
        "final_risk_level": decision["final_risk_level"],
        "final_risk_score": decision["final_risk_score"],
        "llm_response": llm_result["llm_response"],
        "user_message": decision["user_message"]
    }