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

    user_message = ""

    pii_action = pii_result.get("recommended_action", "allow")
    ethics_action = ethics_result.get("recommended_action", "allow")

    # 1️⃣ BLOCK en güçlü karar — PII veya Ethics kaynaklı
    if pii_action == "block":
        final_action = "block"
        prompt_to_send = None
        log_required = True
        block_reason = "Sensitive data detected"
        user_message = "Bu mesaj, kritik düzeyde hassas veri içerdiği için engellendi ve sisteme iletilmedi."

    elif ethics_action == "block":
        final_action = "block"
        prompt_to_send = None
        log_required = True
        block_reason = "Ethics policy violation"
        user_message = "Bu mesaj, kurumsal etik politikasını ihlal ettiği için engellendi."

    # 2️⃣ Bölüm 7.6 Kombinasyon: PII mask + Ethics warn_and_log
    # → final_action = warn_and_log, prompt maskelenmiş halde gönderilir
    elif pii_action == "mask_and_allow" and ethics_action == "warn_and_log":
        final_action = "warn_and_log"
        prompt_to_send = pii_result.get("masked_prompt", prompt)
        log_required = True
        user_message = "Mesajınızdaki kişisel veriler maskelendi ve etik politika ihlali nedeniyle kayıt altına alındı."

    # 3️⃣ Yalnızca PII maskeleme
    elif pii_action == "mask_and_allow":
        final_action = "mask_and_allow"
        prompt_to_send = pii_result.get("masked_prompt", prompt)
        log_required = True
        user_message = "Mesajınızdaki kişisel veriler maskelenerek sisteme iletildi."

    # 4️⃣ Ethics warn_and_log
    elif ethics_action == "warn_and_log":
        final_action = "warn_and_log"
        log_required = True
        user_message = "Mesajınız etik politika ihlali riski taşıdığı için güvenlik kaydına alındı."

    # 5️⃣ Ethics warn — sadece UI uyarısı, DB'ye log yazılmaz
    elif ethics_action == "warn":
        final_action = "warn"
        log_required = False
        user_message = "Mesajınız potansiyel etik risk içeriyor. Lütfen içeriği gözden geçirin."

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
        "user_message": user_message,
        "log_required": log_required,
        "block_reason": block_reason
    }
