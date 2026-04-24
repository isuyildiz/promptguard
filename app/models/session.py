from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    ip_address = Column(String, nullable=True)

    #Oturum tablosunu tanımladık. 
    #id string çünkü frontend'den gelen session_id değeri olacak (örneğin s456).