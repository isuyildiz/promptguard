import json
import os
import datetime
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.jwt_middleware import require_admin
from app.models.ethics_policy import InstitutionEthicsPolicy

router = APIRouter(prefix="/admin/policy", tags=["policy"])


# ---------------------------------------------------------------------------
# Metin çıkarma yardımcıları
# ---------------------------------------------------------------------------

def _extract_text_from_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


def _extract_text_from_pdf(content: bytes) -> str:
    try:
        import pypdf, io
        reader = pypdf.PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF okunamadı: {e}")


def _extract_text_from_docx(content: bytes) -> str:
    try:
        import docx, io
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX okunamadı: {e}")


def extract_text(filename: str, content: bytes) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return _extract_text_from_pdf(content)
    elif ext in ("docx", "doc"):
        return _extract_text_from_docx(content)
    elif ext == "txt":
        return _extract_text_from_txt(content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Desteklenmeyen dosya formatı. PDF, DOCX veya TXT yükleyin."
        )


# ---------------------------------------------------------------------------
# Gemini ile kural üretme
# ---------------------------------------------------------------------------

GEMINI_PROMPT_TEMPLATE = """
You are an AI assistant specialized in compliance and ethics policy analysis.

Analyze the following institutional ethics policy document and extract all violation categories.
For each category provide:
- name: a snake_case identifier (e.g. "homework_delegation", "code_plagiarism")
- description: brief explanation of what this violation means (1-2 sentences)
- keywords: a list of 5-15 phrases or keywords (in both English and Turkish if applicable) that indicate this violation in a user's prompt
- risk_score: integer from 0-100 representing severity
- risk_level: one of "low", "medium", "high", "critical"
- recommended_action: one of "warn", "warn_and_log", "block"

Return ONLY valid JSON with no extra text, no markdown fences, strictly this format:
{{
  "institution_name": "inferred institution name or Unknown",
  "categories": [
    {{
      "name": "category_snake_case",
      "description": "...",
      "keywords": ["keyword1", "keyword2", ...],
      "risk_score": 80,
      "risk_level": "high",
      "recommended_action": "warn_and_log"
    }}
  ]
}}

Ethics policy document:
---
{policy_text}
---
""".strip()


def generate_ethics_rules(policy_text: str) -> dict:
    """
    Gemini API'yi kullanarak politika metninden etik kural seti üretir.
    Dönen dict: {"institution_name": ..., "categories": [...]}
    """
    from google import genai
    from google.genai import types
    from dotenv import load_dotenv
    load_dotenv()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "senin_api_key_buraya":
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY tanımlı değil. .env dosyasını kontrol edin."
        )

    try:
        client = genai.Client(api_key=api_key)
        prompt = GEMINI_PROMPT_TEMPLATE.format(policy_text=policy_text[:8000])
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API hatası: {str(e)}"
        )

    # Markdown kod bloğu varsa temizle
    import re
    # ```json ... ``` veya ``` ... ``` bloğunu bul
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        raw = match.group(1)
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini geçerli JSON döndürmedi. Ham yanıt: {raw[:300]}"
        )


# ---------------------------------------------------------------------------
# Endpoint'ler
# ---------------------------------------------------------------------------

@router.post("/upload")
async def upload_policy(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Kurumun etik politika dosyasını yükler (PDF / DOCX / TXT).
    Dosya metni Gemini'ye gönderilir, üretilen kural seti DB'ye kaydedilir.
    Eski aktif politika devre dışı bırakılır.
    """
    institution_id = current_user["institution_id"]
    if not institution_id:
        raise HTTPException(status_code=400, detail="Bu hesap bir kuruma bağlı değil.")

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dosya okunamadı: {e}")

    if not content:
        raise HTTPException(status_code=400, detail="Dosya boş.")

    policy_text = extract_text(file.filename, content)
    if len(policy_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Dosyadan yeterli metin çıkarılamadı. Daha kapsamlı bir politika belgesi yükleyin."
        )

    rules_dict = generate_ethics_rules(policy_text)

    # Önceki aktif politikaları devre dışı bırak
    db.query(InstitutionEthicsPolicy).filter(
        InstitutionEthicsPolicy.institution_id == institution_id,
        InstitutionEthicsPolicy.is_active == True,
    ).update({"is_active": False})

    # Yeni politikayı kaydet
    policy = InstitutionEthicsPolicy(
        institution_id=institution_id,
        file_name=file.filename,
        policy_text=policy_text,
        ethics_rules=json.dumps(rules_dict, ensure_ascii=False),
        uploaded_at=datetime.datetime.utcnow(),
        is_active=True,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    return {
        "message": "Etik politika başarıyla yüklendi ve analiz edildi.",
        "policy_id": policy.id,
        "file_name": policy.file_name,
        "uploaded_at": policy.uploaded_at.isoformat() + "Z",
        "categories_count": len(rules_dict.get("categories", [])),
        "categories": [c["name"] for c in rules_dict.get("categories", [])],
    }


@router.get("")
def get_policy(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Kurumun aktif etik politikasını ve üretilen kategori listesini döner.
    """
    institution_id = current_user["institution_id"]

    policy = db.query(InstitutionEthicsPolicy).filter(
        InstitutionEthicsPolicy.institution_id == institution_id,
        InstitutionEthicsPolicy.is_active == True,
    ).order_by(InstitutionEthicsPolicy.uploaded_at.desc()).first()

    if not policy:
        return {"has_policy": False, "policy": None}

    rules = json.loads(policy.ethics_rules) if policy.ethics_rules else {}

    return {
        "has_policy": True,
        "policy": {
            "id": policy.id,
            "file_name": policy.file_name,
            "uploaded_at": policy.uploaded_at.isoformat() + "Z",
            "institution_name": rules.get("institution_name", "—"),
            "categories": rules.get("categories", []),
        }
    }
