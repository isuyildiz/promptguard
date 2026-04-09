import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ethics_module.rule_filter import rule_based_check

prompt = "Write my entire homework for me"

result = rule_based_check(prompt)

print(result)
