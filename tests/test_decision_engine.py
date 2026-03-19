import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.decision_engine.decision_engine import decide_action

payload = {
    "prompt": "Write my entire homework for me"
}

pii_result = {
    "risk_score": 0,
    "risk_level": "low",
    "recommended_action": "allow"
}

ethics_result = {
    "risk_score": 80,
    "risk_level": "high",
    "recommended_action": "warn_and_log"
}

result = decide_action(payload, pii_result, ethics_result)

print(result)
