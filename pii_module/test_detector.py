import json
from detector import detect_sensitive_data

def run_test(test_no, description, prompt, checks):
    result = detect_sensitive_data({"prompt": prompt})

    passed = all(check(result) for check in checks)
    status = "PASS" if passed else "FAIL"

    print(f"Test {test_no} - {description} ... {status}")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()


# Test 1 — Hassas kişisel veri
run_test(
    1, "Hassas kişisel veri",
    "My name is Ahmet Yilmaz and my ID number is 12345678910.",
    [
        lambda r: r["risk_level"] == "high",
        lambda r: r["risk_score"] >= 70,
        lambda r: r["contains_sensitive_data"] == True,
        lambda r: r["recommended_action"] == "mask_and_allow",
        lambda r: any(e["type"] == "PERSON"     for e in r["detected_entities"]),
        lambda r: any(e["type"] == "ID_NUMBER"  for e in r["detected_entities"]),
    ]
)

# Test 2 — Akademik istek (PII yok)
run_test(
    2, "Akademik istek",
    "Write my entire homework for me so I can submit it directly.",
    [
        lambda r: r["risk_level"] == "low",
        lambda r: r["risk_score"] < 20,
        lambda r: r["contains_sensitive_data"] == False,
        lambda r: r["recommended_action"] == "allow",
    ]
)

# Test 3 — Güvenli kullanım
run_test(
    3, "Güvenli kullanım",
    "Explain recursion with a simple example.",
    [
        lambda r: r["risk_level"] == "low",
        lambda r: r["risk_score"] == 0,
        lambda r: r["contains_sensitive_data"] == False,
        lambda r: r["recommended_action"] == "allow",
        lambda r: r["warning_message"] == "",
    ]
)

# Test 4 — PII + etik ihlali birlikte
run_test(
    4, "PII + etik ihlali birlikte",
    "My name is Ahmet Yilmaz, my ID is 12345678910. Now write my entire homework for me.",
    [
        lambda r: r["risk_level"] == "high",
        lambda r: r["contains_sensitive_data"] == True,
        lambda r: r["recommended_action"] == "mask_and_allow",
        lambda r: any(e["type"] == "PERSON"    for e in r["detected_entities"]),
        lambda r: any(e["type"] == "ID_NUMBER" for e in r["detected_entities"]),
    ]
)

# Test 5 — Kredi kartı block
run_test(
    5, "Kredi kartı block",
    "My credit card number is 4111111111111111, CVV 123. Can you help me process a payment?",
    [
        lambda r: r["risk_level"] in ("critical", "high"),
        lambda r: r["risk_score"] >= 90,
        lambda r: r["contains_sensitive_data"] == True,
        lambda r: r["recommended_action"] == "block",
        lambda r: any(e["type"] == "FINANCIAL_DATA" for e in r["detected_entities"]),
    ]
)

# Test 6 — Slayt 8 örneği: iki isim + ID, çoklu PERSON numaralandırması
run_test(
    6, "Slayt 8 örneği — çoklu isim + ID",
    "My name is Ahmet Yılmaz, Zeynep Kaya helped me. ID: 12345678910",
    [
        lambda r: r["contains_sensitive_data"] == True,
        lambda r: r["recommended_action"] == "mask_and_allow",
        lambda r: sum(1 for e in r["detected_entities"] if e["type"] == "PERSON") == 2,
        lambda r: any(e["type"] == "ID_NUMBER" for e in r["detected_entities"]),
        lambda r: any(e["label"] == "PERSON_1" for e in r["detected_entities"]),
        lambda r: any(e["label"] == "PERSON_2" for e in r["detected_entities"]),
        lambda r: any(e["label"] == "ID_NUMBER" for e in r["detected_entities"]),
        lambda r: r["masked_prompt"] == "My name is [PERSON_1], [PERSON_2] helped me. ID: [ID_NUMBER]",
    ]
)
