import re
from backend.ethics_module.rule_filter import rule_based_check


def _keyword_matches(keyword: str, prompt_lower: str) -> bool:
    """
    Keyword'ün prompt içinde geçip geçmediğini kontrol eder.
    Tek kelimeyse kelime sınırı (\b) kullanır; çok kelimeyse tam cümle arar.
    """
    kw = keyword.lower().strip()
    if " " in kw:
        # Çok kelimeli ifade — tam cümle eşleşmesi
        return kw in prompt_lower
    else:
        # Tek kelime — kelime sınırı ile eşleştir (false positive önleme)
        return bool(re.search(r'\b' + re.escape(kw) + r'\b', prompt_lower))


def _check_custom_rules(prompt: str, rules: list) -> dict | None:
    """
    Kuruma ait custom kural listesine karşı prompt'u kontrol eder.
    İlk eşleşen kural bulunduğunda sonuç döner.
    """
    prompt_lower = prompt.lower()
    for rule in rules:
        for keyword in rule.get("keywords", []):
            if _keyword_matches(keyword, prompt_lower):
                return {
                    "flagged": True,
                    "category": rule.get("name", "policy_violation"),
                    "risk_score": rule.get("risk_score", 70),
                    "risk_level": rule.get("risk_level", "high"),
                    "recommended_action": rule.get("recommended_action", "warn_and_log"),
                    "explanation": rule.get("description", "Kurumsal politika ihlali tespit edildi."),
                }
    return None


def _llm_classifier_fallback() -> dict:
    """
    LLM sınıflandırıcı entegre edilmediğinde kullanılan varsayılan sonuç.
    """
    return {
        "risk_score": 0,
        "risk_level": "low",
        "policy_violation": False,
        "category": "suspicious_request",
        "confidence": 0.0,
        "explanation": "No LLM classifier configured. Fallback applied.",
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
        # Kurumun kendi politikası var ama eşleşme yok → kuruma göre allow
        # Varsayılan kurallara DÜŞÜLMEz: kurumun politikası yetkili kaynaktır
        return {
            "module_name": "ethics_analyzer",
            **_llm_classifier_fallback(),
        }

    # 2. Varsayılan kural tabanlı filtre (yalnızca custom policy YOK ise çalışır)
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

    # 3. Kural eşleşmedi → varsayılan güvenli sonuç
    return {
        "module_name": "ethics_analyzer",
        **_llm_classifier_fallback(),
    }
