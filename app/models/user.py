from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="individual")
    user_mode = Column(String, default="individual")
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)


    #Kullanıcı tablosunu tanımladık. 
    # role üç değer alabilir: individual, corporate_member, corporate_admin. 
    # institution_id bireysel kullanıcılarda boş (null), kurumsal kullanıcılarda dolu olacak.