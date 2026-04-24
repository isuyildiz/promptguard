from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from app.database import get_db
from app.models.user import User
from app.models.revoked_token import RevokedToken

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    """
    Her korumalı endpoint bu fonksiyonu çağırır.
    Authorization header'ından token'ı okur, kullanıcının DB'de aktif olduğunu doğrular.
    Header formatı: Authorization: Bearer <token>
    """
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="UNAUTHORIZED")

        token = parts[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="UNAUTHORIZED")

        # JTI blacklist kontrolü
        jti = payload.get("jti")
        if jti and db.query(RevokedToken).filter(RevokedToken.jti == jti).first():
            raise HTTPException(status_code=401, detail="TOKEN_REVOKED")

        # Kullanıcının hâlâ aktif olup olmadığını DB'den kontrol et
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="ACCOUNT_DISABLED")

        return {
            "user_id":        str(user.id),
            "user_mode":      user.user_mode,
            "institution_id": user.institution_id,
            "role":           user.role,
        }

    except HTTPException:
        raise
    except JWTError:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")


def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Sadece corporate_admin rolündeki kullanıcılara izin verir.
    """
    if current_user["role"] != "corporate_admin":
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return current_user
