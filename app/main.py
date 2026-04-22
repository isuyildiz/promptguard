import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from app.database import Base, engine
from app.models import institution, user, session
from app.models.institution import Institution
from app.models.user import User
from app.models.session import Session
from app.models.log_models import PromptLog, Alert
from app.models.ethics_policy import InstitutionEthicsPolicy
from app.models.revoked_token import RevokedToken  # noqa: F401 — registers table
from app.routers import auth, gateway, admin
from app.routers import policy

# P4 — I-02: SECRET_KEY startup validation
_secret_key = os.getenv("SECRET_KEY")
if not _secret_key or len(_secret_key) < 32:
    raise RuntimeError("SECRET_KEY is not set or too short (min 32 chars). Set it in your .env file.")

Base.metadata.create_all(bind=engine)


def _run_migrations():
    """
    SQLite'a ALTER TABLE ile yeni kolonlar ekler (yoksa).
    create_all mevcut tabloları değiştirmediği için elle yapılır.
    """
    add_stmts = [
        "ALTER TABLE prompt_logs ADD COLUMN final_risk_score INTEGER",
        "ALTER TABLE prompt_logs ADD COLUMN final_risk_level VARCHAR",
        "ALTER TABLE prompt_logs ADD COLUMN ethics_eval_method VARCHAR",
        "ALTER TABLE users ADD COLUMN full_name VARCHAR",
    ]
    drop_stmts = [
        "ALTER TABLE prompt_logs DROP COLUMN processing_time_ms",
    ]
    with engine.connect() as conn:
        for stmt in add_stmts:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # Kolon zaten varsa SQLite hata verir — güvenle atla
        for stmt in drop_stmts:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # Kolon yoksa veya SQLite sürümü desteklemiyorsa atla


_run_migrations()

# Rate limiter — IP bazlı
limiter = Limiter(key_func=get_remote_address)

# P4 — I-01: disable /docs and /redoc in production
_env = os.getenv("ENVIRONMENT", "production")
app = FastAPI(
    title="PromptGuard",
    docs_url="/docs" if _env == "development" else None,
    redoc_url="/redoc" if _env == "development" else None,
)

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
