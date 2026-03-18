from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.jwt_middleware import require_admin
from app.models.user import User
from app.models.institution import Institution

router = APIRouter(prefix="/admin", tags=["admin"])


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
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "user_mode": u.user_mode,
                "is_active": u.is_active
            }
            for u in users
        ]
    }


@router.get("/alerts")
def get_alerts(current_user: dict = Depends(require_admin)):
    """
    Kuruma ait uyarıları listeler.
    Kişi 2'nin loglama modülü hazır olunca burası doldurulacak.
    """
    # TODO: Kişi 2 hazır olunca alerts tablosundan veri gelecek
    return {"alerts": []}


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
    if target_user.institution_id != current_user["institution_id"]:
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
    Kişi 2'nin loglama modülü hazır olunca prompt ve alert sayıları doldurulacak.
    """
    institution_id = current_user["institution_id"]

    # Kuruma kayıtlı toplam kullanıcı sayısı
    total_users = db.query(User).filter(
        User.institution_id == institution_id
    ).count()

    # Aktif kullanıcı sayısı
    active_users = db.query(User).filter(
        User.institution_id == institution_id,
        User.is_active == True
    ).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_prompts": 0,    # TODO: Kişi 2 hazır olunca doldurulacak
        "total_alerts": 0,     # TODO: Kişi 2 hazır olunca doldurulacak
        "blocked_count": 0     # TODO: Kişi 2 hazır olunca doldurulacak
    }