import re
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from pydantic import BaseModel
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User
from app.models.institution import Institution
from app.models.revoked_token import RevokedToken

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DUMMY_HASH = pwd_context.hash("__dummy_password_for_timing__")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


# --- Gelen veriyi tanımlayan modeller ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    user_mode: str = "individual"
    institution_code: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str


# --- Yardımcı fonksiyonlar ---

def _validate_password(password: str) -> None:
    """
    Şifre karmaşıklık kuralları:
    - En az 8 karakter
    - En az bir büyük harf
    - En az bir küçük harf
    - En az bir rakam
    - En az bir özel karakter (!@#$%^&* vb.)
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalıdır.")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Şifre en az bir büyük harf içermelidir.")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Şifre en az bir küçük harf içermelidir.")
    if not re.search(r'\d', password):
        raise HTTPException(status_code=400, detail="Şifre en az bir rakam içermelidir.")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?`~]', password):
        raise HTTPException(status_code=400, detail="Şifre en az bir özel karakter içermelidir (!@#$%^&* vb.).")


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# --- Endpoint'ler ---

@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    # Şifre karmaşıklık kurallarını kontrol et
    _validate_password(body.password)

    # Aynı email ile kayıt var mı kontrol et
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")

    # Kurumsal kayıt ise institution_code doğrula
    institution_id = None
    role = "individual"
    if body.user_mode == "institutional":
        if not body.institution_code:
            raise HTTPException(status_code=400, detail="Kurumsal kayıt için institution_code gerekli")
        institution = db.query(Institution).filter(
            Institution.code == body.institution_code
        ).first()
        if not institution:
            raise HTTPException(status_code=404, detail="Kurum bulunamadı")
        institution_id = institution.id
        role = "corporate_member"

    # Şifreyi hashle
    hashed = pwd_context.hash(body.password)

    # Kullanıcıyı kaydet
    new_user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hashed,
        role=role,
        user_mode=body.user_mode,
        institution_id=institution_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Kayıt başarılı"}


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    # Kullanıcıyı bul
    user = db.query(User).filter(User.email == body.email).first()

    # DUMMY_HASH: kullanıcı bulunamazsa da verify çalıştır → timing saldırısını önler
    hash_to_check = user.hashed_password if user else DUMMY_HASH
    password_ok = pwd_context.verify(body.password, hash_to_check)

    if not user or not password_ok:
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

    # Hesap aktif mi?
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hesabınız devre dışı bırakılmış")

    # Token içine koyulacak bilgiler — bunlar JWT'den okunacak
    token_data = {
        "sub": str(user.id),
        "user_mode": user.user_mode,
        "institution_id": user.institution_id,
        "role": user.role
    }

    token = create_access_token(token_data)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            payload = jwt.decode(parts[1], SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get("jti")
            if jti:
                db.add(RevokedToken(jti=jti, revoked_at=datetime.utcnow()))
                db.commit()
    except Exception:
        pass  # Token geçersizse bile logout başarılı sayılır
    return {"message": "Çıkış başarılı"}