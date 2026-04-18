import json
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.jwt_middleware import get_current_user
from app.services.llm_service import send_to_llm
from pii_module.detector import detect_sensitive_data
from app.logger import log_entry
from backend.ethics_module.ethics_analyzer import analyze_ethics
from backend.decision_engine.decision_engine import decide_action
from app.models.log_models import PromptLog
from app.models.ethics_policy import InstitutionEthicsPolicy
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["gateway"])


# ---------------------------------------------------------------------------
# Yardımcı: kuruma ait aktif etik kural listesini DB'den yükle
# ---------------------------------------------------------------------------

def _load_institution_ethics_rules(db: Session, institution_id) -> list | None:
    """
    Kurumun aktif politikasını DB'den çeker, kural listesini döner.
    Politika yoksa None döner.
    """
    if not institution_id:
        return None
    policy = db.query(InstitutionEthicsPolicy).filter(
        InstitutionEthicsPolicy.institution_id == institution_id,
        InstitutionEthicsPolicy.is_active == True,
    ).order_by(InstitutionEthicsPolicy.uploaded_at.desc()).first()

    if not policy or not policy.ethics_rules:
        return None

    try:
        rules_dict = json.loads(policy.ethics_rules)
        return rules_dict.get("categories", [])
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# Bireysel kullanıcı için sabit "etikten muaf" sonuç
# ---------------------------------------------------------------------------

def _ethics_exempt_result() -> dict:
    return {
        "module_name": "ethics_analyzer",
        "risk_score": 0,
        "risk_level": "low",
        "policy_violation": False,
        "category": "safe_usage",
        "confidence": 1.0,
        "explanation": "Bireysel kullanıcılar etik analizden muaftır.",
        "recommended_action": "allow",
    }


# --- Gelen veriyi tanımlayan model ---

class SendRequest(BaseModel):
    prompt: str
    session_id: str
    course_id: Optional[str] = None


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
def analyze(body: SendRequest, current_user: dict = Depends(get_current_user),
            db: Session = Depends(get_db)):
    """
    Promptu analiz eder ama LLM'e GÖNDERMEZ.
    Kalıcı log OLUŞTURMAZ.
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=400,
                            detail={"error": True, "error_code": "EMPTY_PROMPT",
                                    "message": "Prompt boş olamaz"})

    internal_payload = build_internal_payload(body, current_user)
    pii_result = detect_sensitive_data(internal_payload)

    # Bireysel kullanıcı → etik analizden muaf
    user_mode = current_user["user_mode"]
    if user_mode == "individual":
        ethics_result = _ethics_exempt_result()
    else:
        custom_rules = _load_institution_ethics_rules(db, current_user["institution_id"])
        ethics_result = analyze_ethics(internal_payload, custom_rules=custom_rules)

    decision = decide_action(internal_payload, pii_result, ethics_result)

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
@limiter.limit("20/minute")
def send(request: Request, body: SendRequest, current_user: dict = Depends(get_current_user),
         db: Session = Depends(get_db)):
    """
    Promptu analiz eder ve LLM'e gönderir.
    Bireysel kullanıcılar yalnızca PII modülünden geçer, etik analizden muaftır.
    Kurumsal kullanıcılar kuruma ait custom etik kurallarla analiz edilir.
    """
    if not body.prompt.strip():
        raise HTTPException(status_code=400,
                            detail={"error": True, "error_code": "EMPTY_PROMPT",
                                    "message": "Prompt boş olamaz"})

    internal_payload = build_internal_payload(body, current_user)
    pii_result = detect_sensitive_data(internal_payload)

    # Bireysel kullanıcı → etik analizden muaf
    user_mode = current_user["user_mode"]
    if user_mode == "individual":
        ethics_result = _ethics_exempt_result()
    else:
        custom_rules = _load_institution_ethics_rules(db, current_user["institution_id"])
        ethics_result = analyze_ethics(internal_payload, custom_rules=custom_rules)

    decision = decide_action(internal_payload, pii_result, ethics_result)

    # BLOCK kontrolü — send_to_llm() kesinlikle çağrılmaz
    if decision["final_action"] == "block":
        try:
            log_entry(
                payload=internal_payload,
                pii_result=pii_result,
                ethics_result=ethics_result,
                decision=decision
            )
        except Exception as log_err:
            print(f"[LOG ERROR] block log_entry başarısız: {log_err}")
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
        try:
            log_entry(
                payload=internal_payload,
                pii_result=pii_result,
                ethics_result=ethics_result,
                decision=decision
            )
        except Exception as log_err:
            print(f"[LOG ERROR] log_entry başarısız: {log_err}")

    return {
        "final_action": decision["final_action"],
        "final_risk_level": decision["final_risk_level"],
        "final_risk_score": decision["final_risk_score"],
        "llm_response": llm_result["llm_response"],
        "user_message": decision["user_message"]
    }


@router.get("/logs")
def get_logs(current_user: dict = Depends(get_current_user),
             db: Session = Depends(get_db)):
    """
    JWT'den okunan user_id ile o kullanıcıya ait prompt_logs kayıtlarını döner.
    Bölüm 10.3 şeması: log_id, final_action, timestamp.
    """
    user_id = current_user["user_id"]

    logs = (
        db.query(PromptLog)
        .filter(PromptLog.user_id == user_id)
        .order_by(PromptLog.timestamp.desc())
        .all()
    )

    return {
        "logs": [
            {
                "log_id":       log.id,
                "final_action": log.final_action,
                "timestamp":    log.timestamp.isoformat() + "Z" if log.timestamp else None,
            }
            for log in logs
        ]
    }