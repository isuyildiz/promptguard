from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    block_on_violation = Column(Boolean, default=False)

    #Kurumları tutan tabloyu tanımladık. 
    #code kurumun benzersiz kodu (giriş ekranında öğrenci bunu girecek), block_on_violation kurumun etik ihlalde otomatik block uygulayıp uygulamayacağı.