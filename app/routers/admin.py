from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.jwt_middleware import require_admin
from app.models.user import User
from app.models.institution import Institution
from app.models.log_models import PromptLog, Alert

router = APIRouter(prefix="/admin", tags=["admin"])


def same_institution(a, b) -> bool:
    if a is None or b is None:
        return False
    return a == b


@router.get("/users")
def get_users(current_user: dict = Depends(require_admin),
              db: Session = Depends(get_db)):
    """
    Yöneticinin kurumuna kayıtlı tüm kullanıcıları listeler.
    Sadece corporate_admin erişebilir.
    """
    institution_id = current_user["institution_id"]

    if not institution_id:
        raise HTTPException(status_code=400,
                            detail={"error": True,
                                    "error_code": "FORBIDDEN",
                                    "message": "Bu hesap bir kuruma bağlı değil"})

    users = db.query(User).filter(
        User.institution_id == institution_id
    ).all()

    return {
        "users": [
            {
                "id":        u.id,
                "email":     u.email,
                "full_name": u.full_name,
                "role":      u.role,
                "user_mode": u.user_mode,
                "is_active": u.is_active,
            }
            for u in users
        ]
    }


SEVERITY_TO_SCORE = {"low": 30, "medium": 55, "high": 80, "critical": 90}


@router.get("/alerts")
def get_alerts(current_user: dict = Depends(require_admin),
               db: Session = Depends(get_db)):
    """
    Kuruma ait uyarıları alerts + prompt_logs join ile döner.
    """
    institution_id = current_user["institution_id"]

    rows = (
        db.query(Alert, PromptLog)
        .outerjoin(PromptLog, Alert.prompt_log_id == PromptLog.id)
        .filter(Alert.institution_id == institution_id)
        .order_by(Alert.created_at.desc())
        .all()
    )

    # Kullanıcı bilgilerini tek sorguda çek
    alert_user_ids = list({int(a.user_id) for a, _ in rows if a.user_id})
    alert_users = db.query(User).filter(User.id.in_(alert_user_ids)).all()
    alert_user_map = {str(u.id): u for u in alert_users}

    return {
        "alerts": [
            {
                "id":            a.id,
                "user_id":       a.user_id,
                "full_name":     alert_user_map.get(str(a.user_id), None) and alert_user_map[str(a.user_id)].full_name,
                "email":         alert_user_map.get(str(a.user_id), None) and alert_user_map[str(a.user_id)].email,
                "alert_type":    a.alert_type,
                "category":      (log.violation_category if log and log.violation_category else a.alert_type),
                "severity":      a.severity,
                "risk_level":    (log.final_risk_level if log and log.final_risk_level else a.severity),
                "risk_score":    (log.final_risk_score if log and log.final_risk_score is not None else SEVERITY_TO_SCORE.get(a.severity, 0)),
                "action":        (log.final_action if log else "block"),
                "masked_prompt": (log.masked_prompt if log else None),
                "is_reviewed":   a.is_reviewed,
                "reviewed":      a.is_reviewed,
                "reviewed_by":   a.reviewed_by,
                "timestamp":     (log.timestamp.isoformat() + "Z" if log and log.timestamp else
                                  (a.created_at.isoformat() + "Z" if a.created_at else None)),
            }
            for a, log in rows
        ]
    }


@router.patch("/alerts/{alert_id}/review")
def review_alert(alert_id: int, is_reviewed: bool,
                 current_user: dict = Depends(require_admin),
                 db: Session = Depends(get_db)):
    """
    Uyarının incelendi/beklemede durumunu günceller.
    """
    institution_id = current_user["institution_id"]
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert bulunamadı")
    if not same_institution(alert.institution_id, institution_id):
        raise HTTPException(status_code=403, detail="Bu alert üzerinde yetkiniz yok")
    alert.is_reviewed = is_reviewed
    if is_reviewed:
        reviewer = db.query(User).filter(User.id == int(current_user["user_id"])).first()
        alert.reviewed_by = reviewer.full_name or reviewer.email if reviewer else current_user["user_id"]
    else:
        alert.reviewed_by = None
    db.commit()
    return {"id": alert_id, "is_reviewed": is_reviewed, "reviewed_by": alert.reviewed_by}


@router.patch("/users/{user_id}")
def toggle_user_access(user_id: int, is_active: bool,
                       current_user: dict = Depends(require_admin),
                       db: Session = Depends(get_db)):
    """
    Kullanıcının erişimini açar veya kapatır.
    Sadece aynı kurumdaki kullanıcılar üzerinde işlem yapılabilir.
    """
    # Kullanıcıyı bul
    target_user = db.query(User).filter(User.id == user_id).first()

    if not target_user:
        raise HTTPException(status_code=404,
                            detail={"error": True,
                                    "error_code": "NOT_FOUND",
                                    "message": "Kullanıcı bulunamadı"})

    # Farklı kurumdaki kullanıcıya müdahale edilemesin
    if not same_institution(target_user.institution_id, current_user["institution_id"]):
        raise HTTPException(status_code=403,
                            detail={"error": True,
                                    "error_code": "FORBIDDEN",
                                    "message": "Bu kullanıcı üzerinde yetkiniz yok"})

    # Güncelle
    target_user.is_active = is_active
    db.commit()

    return {
        "message": f"Kullanıcı erişimi {'açıldı' if is_active else 'kapatıldı'}",
        "user_id": user_id,
        "is_active": is_active
    }


@router.get("/stats")
def get_stats(current_user: dict = Depends(require_admin),
              db: Session = Depends(get_db)):
    """
    Admin paneli için özet istatistikler.
    """
    institution_id = current_user["institution_id"]

    # Kuruma kayıtlı kullanıcı id'leri
    institution_user_ids = [
        u.id for u in db.query(User.id).filter(
            User.institution_id == institution_id
        ).all()
    ]
    institution_user_id_strs = [str(uid) for uid in institution_user_ids]

    # Kullanıcı sayıları
    total_users = len(institution_user_ids)
    active_users = db.query(User).filter(
        User.institution_id == institution_id,
        User.is_active == True
    ).count()

    # prompt_logs: kuruma ait tüm kayıtlar
    total_prompts = db.query(PromptLog).filter(
        PromptLog.user_id.in_(institution_user_id_strs)
    ).count()

    # prompt_logs: block olanlar
    blocked_count = db.query(PromptLog).filter(
        PromptLog.user_id.in_(institution_user_id_strs),
        PromptLog.final_action == "block"
    ).count()

    # alerts: kuruma ait toplam
    total_alerts = db.query(Alert).filter(
        Alert.institution_id == institution_id
    ).count()

    return {
        "total_users":   total_users,
        "active_users":  active_users,
        "total_prompts": total_prompts,
        "total_alerts":  total_alerts,
        "blocked_count": blocked_count,
    }


@router.get("/logs")
def get_logs(current_user: dict = Depends(require_admin),
             db: Session = Depends(get_db)):
    """
    Kuruma ait tüm kullanıcıların prompt_logs kayıtlarını döner.
    """
    institution_id = current_user["institution_id"]

    institution_user_ids = [
        str(u.id) for u in db.query(User.id).filter(
            User.institution_id == institution_id
        ).all()
    ]

    logs = (
        db.query(PromptLog)
        .filter(PromptLog.user_id.in_(institution_user_ids))
        .order_by(PromptLog.timestamp.desc())
        .limit(200)
        .all()
    )

    # Kullanıcı bilgilerini tek sorguda çek
    log_user_ids = list({int(log.user_id) for log in logs if log.user_id})
    log_users = db.query(User).filter(User.id.in_(log_user_ids)).all()
    log_user_map = {str(u.id): u for u in log_users}

    return {
        "logs": [
            {
                "id":            log.id,
                "user_id":       log.user_id,
                "full_name":     log_user_map.get(log.user_id, None) and log_user_map[log.user_id].full_name,
                "email":         log_user_map.get(log.user_id, None) and log_user_map[log.user_id].email,
                "masked_prompt":      log.masked_prompt,
                "final_action":       log.final_action,
                "risk_level":         log.final_risk_level or log.pii_risk_level or "low",
                "risk_score":         log.final_risk_score or 0,
                "ethics_eval_method": log.ethics_eval_method,
                "timestamp":          log.timestamp.isoformat() + "Z" if log.timestamp else None,
            }
            for log in logs
        ]
    }