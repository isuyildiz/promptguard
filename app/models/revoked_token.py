from sqlalchemy import Column, String, DateTime
from app.database import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    jti = Column(String, primary_key=True, index=True)
    revoked_at = Column(DateTime, nullable=False)
