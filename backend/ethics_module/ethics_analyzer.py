from backend.ethics_module.rule_filter import rule_based_check


def analyze_ethics(payload: dict) -> dict:

    prompt = payload.get("prompt", "")

    rule_result = rule_based_check(prompt)

    if rule_result["flagged"]:
        return {
            "module_name": "ethics_analyzer",
            "risk_score": rule_result["risk_score"],
            "risk_level": "high",
            "policy_violation": True,
            "category": rule_result["category"],
            "confidence": 0.9,
            "explanation": "Prompt appears to request academic work completion.",
            "recommended_action": "warn_and_log"
        }

    return {
        "module_name": "ethics_analyzer",
        "risk_score": rule_result["risk_score"],
        "risk_level": "low",
        "policy_violation": False,
        "category": "safe_usage",
        "confidence": 0.95,
        "explanation": "No policy violation detected.",
        "recommended_action": "allow"
    }
