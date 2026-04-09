import re

SUSPICIOUS_PATTERNS = [
    r"write.*homework",
    r"do.*assignment",
    r"write.*assignment",
    r"solve.*exam",
    r"answer.*exam",
    r"complete.*homework",
]

def rule_based_check(prompt: str):

    prompt_lower = prompt.lower()

    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, prompt_lower):
            return {
                "flagged": True,
                "category": "academic_misuse",
                "risk_score": 80
            }

    return {
        "flagged": False,
        "category": "safe_usage",
        "risk_score": 10
    }
