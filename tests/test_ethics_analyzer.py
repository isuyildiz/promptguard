import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ethics_module.ethics_analyzer import analyze_ethics

payload = {
    "prompt": "Write my entire homework for me"
}

result = analyze_ethics(payload)

print(result)
