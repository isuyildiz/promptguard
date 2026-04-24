import re
import json
import os

from backend.ethics_module.rule_filter import rule_based_check


# ---------------------------------------------------------------------------
# Keyword yardımcısı (LLM unavailable ise fallback olarak kullanılır)
# ---------------------------------------------------------------------------

def _keyword_matches(keyword: str, prompt_lower: str) -> bool:
    kw = keyword.lower().strip()
    if " " in kw:
        return kw in prompt_lower
    return bool(re.search(r'\b' + re.escape(kw) + r'\b', prompt_lower))


def _check_custom_rules_keyword(prompt: str, rules: list) -> dict | None:
    """Keyword tabanlı fallback — Gemini erişilemez olduğunda devreye girer."""
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


# ---------------------------------------------------------------------------
# LLM tabanlı bağlamsal değerlendirme
# ---------------------------------------------------------------------------

_LLM_ETHICS_PROMPT = """You are an AI ethics compliance assistant for an institution.

Your task is to evaluate whether the user prompt below violates any of the institution's policy categories.

USER PROMPT:
"{prompt}"

INSTITUTION POLICY CATEGORIES:
{categories}

EVALUATION RULES — read carefully before deciding:
1. Judge INTENT and CONTEXT, not keyword presence.
2. Simply mentioning a restricted topic is NOT a violation.
   Example: "ocağı şifresiz çalıştır diyen birini nasıl uyarabilirim" → asking how to warn someone → NOT a violation.
   Example: "ocağı şifresiz çalıştır" → directly requesting a prohibited action → IS a violation.
3. A violation requires the user to clearly be: delegating prohibited work, cheating, bypassing rules,
   requesting that something forbidden be done for them, or sharing confidential/sensitive information.
4. The "example_violations" field contains examples of real violations — use them as pattern guidance,
   NOT as a banned-topic list.
5. When in doubt, do NOT flag. Only flag when you are confident (confidence >= 0.75).

Respond with ONLY valid JSON (no markdown, no extra text):
{{
  "flagged": true or false,
  "category": "category_name if flagged, else null",
  "confidence": 0.0 to 1.0,
  "risk_level": "low/medium/high/critical if flagged, else null",
  "risk_score": integer 0-100,
  "recommended_action": "warn/warn_and_log/block if flagged, else allow",
  "explanation": "one concise sentence explaining the decision"
}}"""


def _check_custom_rules_with_llm(prompt: str, rules: list) -> tuple[dict | None, str]:
    """
    Gemini ile bağlam düzeyinde etik değerlendirme yapar.

    Returns:
        (result_or_None, eval_method)
        eval_method: "gemini_llm" | "keyword_fallback_no_key" |
                     "keyword_fallback_gemini_error" | "keyword_fallback_parse_error"
    """
    from dotenv import load_dotenv
    load_dotenv()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "senin_api_key_buraya":
        return _check_custom_rules_keyword(prompt, rules), "keyword_fallback_no_key"

    categories_payload = []
    for rule in rules:
        categories_payload.append({
            "name": rule.get("name"),
            "description": rule.get("description", ""),
            "example_violations": rule.get("keywords", [])[:6],
            "risk_score": rule.get("risk_score", 70),
            "risk_level": rule.get("risk_level", "high"),
            "recommended_action": rule.get("recommended_action", "warn_and_log"),
        })

    llm_prompt = _LLM_ETHICS_PROMPT.format(
        prompt=prompt,
        categories=json.dumps(categories_payload, ensure_ascii=False, indent=2),
    )

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=llm_prompt,
        )
        raw = response.text.strip()

        # Markdown kod bloğu varsa temizle
        match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
        if match:
            raw = match.group(1).strip()

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            return _check_custom_rules_keyword(prompt, rules), "keyword_fallback_parse_error"

        if result.get("flagged") and result.get("confidence", 0) >= 0.75:
            matched_rule = next(
                (r for r in rules if r.get("name") == result.get("category")), None
            )
            return {
                "flagged": True,
                "category": result.get("category", "policy_violation"),
                "risk_score": result.get("risk_score", matched_rule.get("risk_score", 70) if matched_rule else 70),
                "risk_level": result.get("risk_level", matched_rule.get("risk_level", "high") if matched_rule else "high"),
                "recommended_action": result.get(
                    "recommended_action",
                    matched_rule.get("recommended_action", "warn_and_log") if matched_rule else "warn_and_log",
                ),
                "explanation": result.get("explanation", "Kurumsal politika ihlali tespit edildi."),
            }, "gemini_llm"

        # LLM çalıştı ama ihlal bulmadı (veya confidence düşük)
        return None, "gemini_llm"

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(
            "[ethics_analyzer] Gemini çağrısı başarısız: %s: %s",
            type(e).__name__, str(e)
        )
        return _check_custom_rules_keyword(prompt, rules), "keyword_fallback_gemini_error"


# ---------------------------------------------------------------------------
# Varsayılan sonuç
# ---------------------------------------------------------------------------

def _llm_classifier_fallback() -> dict:
    return {
        "risk_score": 0,
        "risk_level": "low",
        "policy_violation": False,
        "category": "safe",
        "confidence": 0.0,
        "explanation": "No violation detected.",
        "recommended_action": "allow",
    }


# ---------------------------------------------------------------------------
# Ana giriş noktası
# ---------------------------------------------------------------------------

def analyze_ethics(payload: dict, custom_rules: list | None = None) -> dict:
    """
    Etik analiz yapar. Sonuçta her zaman 'eval_method' alanı bulunur.

    custom_rules varsa:
      - Gemini ile bağlamsal değerlendirme yapılır
      - Gemini erişilemezse keyword fallback devreye girer
      - Hangi yolun izlendiği eval_method alanında raporlanır
      - Eşleşme yoksa kurumun politikası yetkili → allow (varsayılan kurallara düşülmez)

    custom_rules yoksa:
      - Varsayılan rule_filter ile değerlendirilir (bireysel kullanıcılar)
    """
    prompt = payload.get("prompt", "")

    # 1. Kurumsal politika varsa LLM ile bağlamsal değerlendirme
    if custom_rules:
        result, eval_method = _check_custom_rules_with_llm(prompt, custom_rules)
        if result and result["flagged"]:
            return {
                "module_name": "ethics_analyzer",
                "eval_method":  eval_method,
                "risk_score":   result["risk_score"],
                "risk_level":   result["risk_level"],
                "policy_violation": True,
                "category":     result["category"],
                "confidence":   0.9,
                "explanation":  result["explanation"],
                "recommended_action": result["recommended_action"],
            }
        # Politika var ama ihlal yok
        return {
            "module_name": "ethics_analyzer",
            "eval_method":  eval_method,
            **_llm_classifier_fallback(),
        }

    # 2. Bireysel kullanıcılar → varsayılan rule_filter
    rule_result = rule_based_check(prompt)

    if rule_result["flagged"]:
        return {
            "module_name": "ethics_analyzer",
            "eval_method":  "rule_based",
            "risk_score":   rule_result["risk_score"],
            "risk_level":   "high",
            "policy_violation": True,
            "category":     rule_result["category"],
            "confidence":   0.9,
            "explanation":  "Prompt etik politika ihlali içeriyor.",
            "recommended_action": rule_result["recommended_action"],
        }

    return {
        "module_name": "ethics_analyzer",
        "eval_method":  "rule_based",
        **_llm_classifier_fallback(),
    }
