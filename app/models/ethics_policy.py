from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from app.database import Base
import datetime


class InstitutionEthicsPolicy(Base):
    """
    Her kurumun admin tarafından yüklenen etik politika dosyasını ve
    Gemini tarafından üretilen kural setini saklar.
    """
    __tablename__ = "institution_ethics_policies"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    file_name      = Column(String, nullable=True)
    policy_text    = Column(Text, nullable=True)   # dosyadan çıkarılan ham metin
    ethics_rules   = Column(Text, nullable=True)   # Gemini'nin ürettiği JSON kural seti
    uploaded_at    = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    is_active      = Column(Boolean, default=True, nullable=False)
