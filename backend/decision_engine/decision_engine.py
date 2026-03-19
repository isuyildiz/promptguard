def max_risk_level(level1: str, level2: str) -> str:
    """
    Risk level karşılaştırması yapar.
    low < medium < high < critical
    """
    order = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4
    }

    return level1 if order.get(level1, 1) >= order.get(level2, 1) else level2


def decide_action(payload: dict, pii_result: dict, ethics_result: dict) -> dict:

    prompt = payload.get("prompt", "")

    final_action = "allow"
    prompt_to_send = prompt
    log_required = False
    block_reason = None

    # 1️⃣ BLOCK en güçlü karar
    if pii_result.get("recommended_action") == "block":
        final_action = "block"
        prompt_to_send = None
        log_required = True
        block_reason = "Sensitive data detected"

    # 2️⃣ Ethics warn_and_log
    elif ethics_result.get("recommended_action") == "warn_and_log":
        final_action = "warn_and_log"
        log_required = True

    # 3️⃣ PII mask_and_allow
    elif pii_result.get("recommended_action") == "mask_and_allow":
        final_action = "mask_and_allow"
        prompt_to_send = pii_result.get("masked_prompt", prompt)
        log_required = True

    # 4️⃣ warn
    elif ethics_result.get("recommended_action") == "warn":
        final_action = "warn"
        log_required = True

    # Final sonuç
    return {
        "final_action": final_action,
        "final_risk_level": max_risk_level(
            pii_result.get("risk_level", "low"),
            ethics_result.get("risk_level", "low")
        ),
        "final_risk_score": max(
            pii_result.get("risk_score", 0),
            ethics_result.get("risk_score", 0)
        ),
        "prompt_to_send": prompt_to_send,
        "user_message": "Decision processed by security gateway.",
        "log_required": log_required,
        "block_reason": block_reason
    }
