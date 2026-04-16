from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import Base, engine
from app.models import institution, user, session
from app.models.institution import Institution
from app.models.user import User
from app.models.session import Session
from app.models.log_models import PromptLog, Alert
from app.models.ethics_policy import InstitutionEthicsPolicy
from app.routers import auth, gateway, admin
from app.routers import policy

Base.metadata.create_all(bind=engine)

# Rate limiter — IP bazlı
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="PromptGuard")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(gateway.router)
app.include_router(admin.router)
app.include_router(policy.router)

@app.get("/")
def root():
    return {"message": "PromptGuard çalışıyor"}
