from fastapi import FastAPI
from app.database import Base, engine
from app.models import institution, user, session
from app.models.institution import Institution
from app.models.user import User
from app.models.session import Session
from app.routers import auth, gateway, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PromptGuard")

app.include_router(auth.router)
app.include_router(gateway.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "PromptGuard çalışıyor"}

    #FastAPI'nin otomatik oluşturduğu bir arayüz açılacak 
    # — burada endpoint'leri doğrudan test edebilirsin