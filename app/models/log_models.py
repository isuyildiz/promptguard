from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


class PromptLog(Base):
    """
    Her /send gönderimini kaydeder.
    Bölüm 9.3 — prompt_logs tablosu
    """
    __tablename__ = "prompt_logs"

    # Birincil anahtar
    id              = Column(Integer, primary_key=True, autoincrement=True)

    # Kimlik bilgileri (JWT'den gelir, Kişi 1'in internal_payload'undan)
    session_id      = Column(String, nullable=False)
    user_id         = Column(String, nullable=False)

    # Zaman damgası
    timestamp       = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Prompt bilgileri (ham metin SAKLANMAZ — Bölüm 9.1 güvenlik kararı)
    prompt_hash     = Column(String, nullable=False)   # SHA-256 hash
    masked_prompt   = Column(Text,   nullable=True)    # Maskelenmiş hali

    # PII analiz sonuçları
    pii_detected    = Column(Text,   nullable=True)    # JSON string (detected_entities listesi)
    pii_risk_level  = Column(String, nullable=True)    # low / medium / high / critical
    pii_action      = Column(String, nullable=True)    # PII modülünün recommended_action'ı

    # Etik analiz sonuçları
    ethical_violation   = Column(Boolean, nullable=True)
    violation_category  = Column(String,  nullable=True)  # safe_usage, academic_misuse vs.
    violation_confidence= Column(Float,   nullable=True)  # 0.0 - 1.0

    # Final karar
    final_action        = Column(String,  nullable=False)  # allow / warn / mask_and_allow / warn_and_log / block
    final_risk_score    = Column(Integer, nullable=True)   # 0-100 birleşik risk skoru
    final_risk_level    = Column(String,  nullable=True)   # low / medium / high / critical

    # Performans
    processing_time_ms  = Column(Integer, nullable=True)

    # İlişki: bu log'a ait alertler
    alerts = relationship("Alert", back_populates="prompt_log")


class Alert(Base):
    """
    PII uyarısı veya etik ihlal kayıtları.
    Yönetici panelinde görünür.
    Bölüm 9.3 — alerts tablosu
    """
    __tablename__ = "alerts"

    # Birincil anahtar
    id              = Column(Integer, primary_key=True, autoincrement=True)

    # İlişkiler
    prompt_log_id   = Column(Integer, ForeignKey("prompt_logs.id"), nullable=False)   # prompt_logs.id
    user_id         = Column(String,  nullable=False)   # users.id
    institution_id  = Column(String,  nullable=True)    # institutions.id (bireysel ise null)

    # Uyarı bilgileri
    alert_type      = Column(String,  nullable=False)   # "pii_warning" veya "ethics_violation"
    severity        = Column(String,  nullable=False)   # low / medium / high

    # Yönetici inceleme durumu
    is_reviewed     = Column(Boolean, default=False,    nullable=False)
    reviewed_by     = Column(String,  nullable=True)    # İnceleyen yöneticinin user_id'si

    # Zaman damgası
    created_at      = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # İlişki: bağlı olduğu log kaydı
    prompt_log = relationship("PromptLog", back_populates="alerts")