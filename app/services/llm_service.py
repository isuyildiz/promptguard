from datetime import datetime
import os
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"


def send_to_llm(session_id: str, prompt: str, user_mode: str) -> dict:
    """
    final_action = 'block' ise bu fonksiyon ÇAĞRILMAZ (kontrol gateway'de yapılır).
    Gemini API'ye prompt'u iletir ve yanıtı döner.
    """

    if not GEMINI_API_KEY or GEMINI_API_KEY == "senin_api_key_buraya":
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "error_code": "LLM_API_ERROR",
                "message": "GEMINI_API_KEY tanımlı değil. .env dosyasına geçerli bir API key ekleyin."
            }
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)

        if user_mode == "institutional":
            system_instruction = (
                "You are a helpful assistant operating in an institutional academic setting. "
                "Follow strict academic integrity guidelines. "
                "Do not complete assignments, exams, or tasks on behalf of students. "
                "Provide guidance and explanations, not direct answers to homework."
            )
        else:
            system_instruction = (
                "You are a helpful and friendly assistant. "
                "Answer the user's questions clearly and concisely."
            )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
            ),
        )

        return {
            "llm_response": response.text,
            "model_name": GEMINI_MODEL,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "error_code": "LLM_API_ERROR",
                "message": str(e)
            }
        )
