from datetime import datetime
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def send_to_llm(session_id: str, prompt: str, user_mode: str) -> dict:
    """
    Bu fonksiyon Gateway Backend'in sorumluluğundadır.
    final_action = 'block' ise bu fonksiyon ÇAĞRILMAZ.
    Karar motoru onay verirse promptu LLM'e iletir ve yanıtı döner.
    """

    # API key yoksa hata ver
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail={"error": True, "error_code": "LLM_API_ERROR",
                    "message": "OpenAI API key tanımlı değil"}
        )

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        # Bireysel ve kurumsal mod için farklı system message
        if user_mode == "institutional":
            system_message = (
                "You are a helpful assistant operating in an institutional setting. "
                "Follow strict academic integrity guidelines. "
                "Do not complete assignments, exams, or tasks on behalf of students."
            )
        else:
            system_message = "You are a helpful assistant."

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]
        )

        return {
            "llm_response": response.choices[0].message.content,
            "model_name": "gpt-4o-mini",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": True, "error_code": "LLM_API_ERROR",
                    "message": str(e)}
        )

#API key almak istersen şu adımları izle:

#**1.** `platform.openai.com` adresine git ve hesap aç.

#**2.** Giriş yaptıktan sonra sol menüden **API Keys** sekmesine git.

#**3.** **Create new secret key** butonuna bas, bir isim ver ve oluştur.

#**4.** Çıkan key'i hemen kopyala — bir daha gösterilmiyor.

#**5.** `.env` dosyanda şu satırı güncelle:

#OPENAI_API_KEY=sk-proj-...buraya_kopyaladığın_key...