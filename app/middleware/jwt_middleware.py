from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def get_current_user(authorization: str = Header(...)):
    """
    Her korumalı endpoint bu fonksiyonu çağırır.
    Authorization header'ından token'ı okur ve kullanıcı bilgilerini döner.
    Header formatı: Authorization: Bearer <token>
    """
    try:
        # "Bearer <token>" formatından token kısmını al
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="UNAUTHORIZED")

        token = parts[1]

        # Token'ı çöz
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Token içinden kullanıcı bilgilerini çıkar
        user_id = payload.get("sub")
        user_mode = payload.get("user_mode")
        institution_id = payload.get("institution_id")
        role = payload.get("role")

        if user_id is None:
            raise HTTPException(status_code=401, detail="UNAUTHORIZED")

        return {
            "user_id": user_id,
            "user_mode": user_mode,
            "institution_id": institution_id,
            "role": role
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")


def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Sadece corporate_admin rolündeki kullanıcılara izin verir.
    Admin endpoint'leri bu fonksiyonu kullanır.
    """
    if current_user["role"] != "corporate_admin":
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return current_user


    #Bu, token içinde doğru bilgilerin saklandığını gösteriyor. 
    # Middleware bu bilgileri her istekte otomatik olarak okuyacak.