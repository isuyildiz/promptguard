import json
from backend.ethics_module.rule_filter import rule_based_check


def _check_custom_rules(prompt: str, rules: list) -> dict | None:
    """
    Kuruma ait custom kural listesine karşı prompt'u kontrol eder.
    İlk eşleşen kural bulunduğunda sonuç döner.
    """
    prompt_lower = prompt.lower()
    for rule in rules:
        for keyword in rule.get("keywords", []):
            if keyword.lower() in prompt_lower:
                return {
                    "flagged": True,
                    "category": rule.get("name", "policy_violation"),
                    "risk_score": rule.get("risk_score", 70),
                    "risk_level": rule.get("risk_level", "high"),
                    "recommended_action": rule.get("recommended_action", "warn_and_log"),
                    "explanation": rule.get("description", "Kurumsal politika ihlali tespit edildi."),
                }
    return None


def _call_llm_classifier(prompt: str) -> dict:
    """
    Prompt'u LLM'e göndererek etik sınıflandırması yapar.
    JSON parse başarısız olursa JSONDecodeError fırlatır — çağıran taraf fallback'e düşer.
    """
    # --- MOCK AKTIF: Her zaman geçersiz JSON döndürür → JSONDecodeError tetiklenir ---
    raw_response = "MOCK: intentionally invalid JSON to trigger fallback path"
    # --- MOCK SONU ---

    # --- ORIGINAL IMPLEMENTATION (devre dışı) ---
    # from openai import OpenAI
    # import os
    # client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    # response = client.chat.completions.create(
    #     model="gpt-4o-mini",
    #     messages=[{"role": "system", "content": "..."}, {"role": "user", "content": prompt}]
    # )
    # raw_response = response.choices[0].message.content
    # --- ORIGINAL IMPLEMENTATION END ---

    return json.loads(raw_response)


def _llm_classifier_fallback(prompt: str) -> dict:
    """
    _call_llm_classifier() JSONDecodeError fırlattığında devreye girer.
    Bölüm 6.6: category='suspicious_request', confidence=0.0, action='allow'
    """
    return {
        "risk_score": 0,
        "risk_level": "low",
        "policy_violation": False,
        "category": "suspicious_request",
        "confidence": 0.0,
        "explanation": "LLM classifier response could not be parsed. Fallback applied.",
        "recommended_action": "allow"
    }


def analyze_ethics(payload: dict, custom_rules: list | None = None) -> dict:
    """
    Etik analiz yapar.

    custom_rules: kurumun DB'den yüklenen kural listesi.
      - Varsa: önce custom kurallara, ardından varsayılan rule_filter'a bakılır.
        İkisinden biri eşleşirse sonuç döner; en yüksek risk skoru kazanır.
      - Yoksa: yalnızca varsayılan rule_filter kullanılır.
    """
    prompt = payload.get("prompt", "")

    # 1. Custom kurum kurallarını dene (varsa)
    if custom_rules:
        result = _check_custom_rules(prompt, custom_rules)
        if result and result["flagged"]:
            return {
                "module_name": "ethics_analyzer",
                "risk_score": result["risk_score"],
                "risk_level": result["risk_level"],
                "policy_violation": True,
                "category": result["category"],
                "confidence": 0.9,
                "explanation": result["explanation"],
                "recommended_action": result["recommended_action"],
            }
        # Custom kural eşleşmedi — güvenlik ağı olarak varsayılan kurallara da bak

    # 2. Varsayılan kural tabanlı filtre (her zaman çalışır)
    rule_result = rule_based_check(prompt)

    if rule_result["flagged"]:
        return {
            "module_name": "ethics_analyzer",
            "risk_score": rule_result["risk_score"],
            "risk_level": "high",
            "policy_violation": True,
            "category": rule_result["category"],
            "confidence": 0.9,
            "explanation": "Prompt etik politika ihlali içeriyor.",
            "recommended_action": rule_result["recommended_action"],
        }

    # 3. Kural geçtiyse LLM sınıflandırıcıya gönder (mock fallback)
    try:
        llm_result = _call_llm_classifier(prompt)
    except json.JSONDecodeError:
        llm_result = _llm_classifier_fallback(prompt)

    return {
        "module_name": "ethics_analyzer",
        **llm_result,
    }
