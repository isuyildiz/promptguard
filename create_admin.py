"""
Çalıştırma: python create_admin.py
Proje kök dizininden çalıştırılmalı.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models.institution import Institution
from app.models.user import User
from app.models import institution, user, session
from app.models.log_models import PromptLog, Alert
from app.models.ethics_policy import InstitutionEthicsPolicy
from app.database import Base
from passlib.context import CryptContext

Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# --- Kurum oluştur (yoksa) ---
INSTITUTION_NAME = "Demo Üniversitesi"
INSTITUTION_CODE = "DEMO2024"

inst = db.query(Institution).filter(Institution.code == INSTITUTION_CODE).first()
if not inst:
    inst = Institution(name=INSTITUTION_NAME, code=INSTITUTION_CODE, block_on_violation=False)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    print(f"[OK] Kurum oluşturuldu: {INSTITUTION_NAME} (code={INSTITUTION_CODE}, id={inst.id})")
else:
    print(f"[--] Kurum zaten mevcut: id={inst.id}")

# --- Admin kullanıcı oluştur (yoksa) ---
ADMIN_EMAIL    = "admin2@demo.com"
ADMIN_PASSWORD = "Admin123!"

existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
if existing:
    # Rolü corporate_admin yap ve kuruma bağla
    existing.role           = "corporate_admin"
    existing.user_mode      = "institutional"
    existing.institution_id = inst.id
    existing.is_active      = True
    db.commit()
    print(f"[OK] Mevcut kullanıcı güncellendi: {ADMIN_EMAIL} → corporate_admin")
else:
    admin = User(
        email           = ADMIN_EMAIL,
        hashed_password = pwd_context.hash(ADMIN_PASSWORD),
        role            = "corporate_admin",
        user_mode       = "institutional",
        institution_id  = inst.id,
        is_active       = True,
    )
    db.add(admin)
    db.commit()
    print(f"[OK] Admin kullanıcı oluşturuldu: {ADMIN_EMAIL}")

db.close()

print("\n=== Giriş Bilgileri ===")
print(f"  Email    : {ADMIN_EMAIL}")
print(f"  Şifre    : {ADMIN_PASSWORD}")
print(f"  Kurum    : {INSTITUTION_NAME} ({INSTITUTION_CODE})")
print("\nAdmin paneline erişmek için önce bu bilgilerle login olun.")
