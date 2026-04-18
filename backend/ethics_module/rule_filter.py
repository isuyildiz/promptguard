import re

# ---------------------------------------------------------------------------
# Her kategori için ayrı pattern listesi
# ---------------------------------------------------------------------------

CATEGORY_PATTERNS = {

    "full_task_delegation": [
        # İngilizce — tüm görevi yaptırma
        r"write.*my.*homework",
        r"do.*my.*homework",
        r"finish.*my.*homework",
        r"complete.*my.*homework",
        r"do.*my.*assignment",
        r"write.*my.*assignment",
        r"finish.*my.*assignment",
        r"complete.*my.*assignment",
        r"write.*my.*essay",
        r"write.*my.*report",
        r"write.*my.*thesis",
        r"write.*my.*dissertation",
        r"write.*my.*paper",
        r"do.*it.*for me",
        r"write.*it.*for me",
        r"complete.*it.*for me",
        r"submit.*for me",
        r"so (i|we) can submit",
        r"just.*write.*the.*whole",
        r"write.*the.*entire",
        r"do.*the.*entire",
        # Türkçe — tüm görevi yaptırma
        r"ödevimi.*yap",
        r"ödevimi.*yaz",
        r"ödev.*yap",
        r"ödev.*yaz",
        r"ödevi.*bitir",
        r"ödevi.*tamamla",
        r"tez.*yaz",
        r"makale.*yaz",
        r"rapor.*yaz",
        r"benim.*yerime.*yaz",
        r"benim.*yerime.*yap",
        r"adıma.*yaz",
        r"adıma.*gönder",
        r"tamamını.*yaz",
        r"hepsini.*yaz",
    ],

    "exam_cheating_attempt": [
        # İngilizce — sınav hilesi
        r"solve.*exam",
        r"answer.*exam",
        r"take.*exam.*for me",
        r"do.*exam.*for me",
        r"cheat.*exam",
        r"cheat.*test",
        r"cheat.*on.*quiz",
        r"answers.*to.*the.*exam",
        r"exam.*answers",
        r"test.*answers",
        r"give.*me.*the.*answers",
        r"solve.*the.*quiz",
        r"do.*the.*test.*for me",
        r"pass.*the.*exam.*for me",
        # Türkçe — sınav hilesi
        r"sınav.*çöz",
        r"sınavı.*çöz",
        r"sınav.*yap",
        r"sınav.*cevap",
        r"sınav.*sorular",
        r"kopya.*çek",
        r"kopya.*yap",
        r"test.*cevaplar",
        r"quiz.*cevaplar",
        r"sınav.*geç.*için",
        r"hile.*yap",
    ],

    "policy_violation": [
        # İngilizce — kural/politika ihlali / sistem atlatma
        r"bypass.*filter",
        r"bypass.*rule",
        r"bypass.*restriction",
        r"bypass.*policy",
        r"bypass.*guard",
        r"ignore.*rule",
        r"ignore.*policy",
        r"ignore.*guideline",
        r"ignore.*restriction",
        r"ignore.*instruction",
        r"override.*rule",
        r"override.*policy",
        r"disable.*filter",
        r"jailbreak",
        r"pretend.*you.*have no.*rule",
        r"act.*as.*if.*you.*have no.*restriction",
        r"forget.*your.*instruction",
        r"forget.*your.*rule",
        r"do.*not.*follow.*rule",
        r"don.*t.*follow.*policy",
        # Türkçe — kural ihlali
        r"kuralları.*atla",
        r"kuralı.*yoksay",
        r"filtreyi.*atla",
        r"kısıtlamayı.*kaldır",
        r"kuralları.*unut",
        r"politikayı.*görmezden",
        r"sistemi.*atla",
        r"sistemi.*kandır",
        r"yasağı.*dele",
    ],

    "suspicious_request": [
        # İngilizce — şüpheli ama net ihlal olmayan
        r"without.*anyone.*knowing",
        r"don.*t.*tell.*anyone",
        r"keep.*it.*secret",
        r"make.*it.*look.*original",
        r"make.*it.*undetectable",
        r"avoid.*plagiarism.*detection",
        r"evade.*detection",
        r"make.*it.*sound.*like.*me",
        r"rewrite.*so.*no.*one.*knows",
        r"paraphrase.*so.*it.*passes",
        r"help.*me.*pass.*without.*studying",
        # Türkçe — şüpheli
        r"kimse.*bilmesin",
        r"gizli.*tut",
        r"intihal.*tespit",
        r"kopya.*gibi.*görünmesin",
        r"benim.*yazmış.*gibi",
        r"fark.*ettirme",
        r"çalışmadan.*geç",
    ],
}

RISK_SCORES = {
    "exam_cheating_attempt": 90,
    "full_task_delegation":  80,
    "policy_violation":      75,
    "suspicious_request":    55,
}

# Kategori bazlı varsayılan aksiyon
CATEGORY_ACTIONS = {
    "exam_cheating_attempt": "warn_and_log",
    "full_task_delegation":  "warn_and_log",
    "policy_violation":      "block",
    "suspicious_request":    "warn_and_log",
}

# Pattern'ları modül yüklenirken bir kez derle (performans)
_COMPILED_PATTERNS = {
    category: [re.compile(p) for p in patterns]
    for category, patterns in CATEGORY_PATTERNS.items()
}


def rule_based_check(prompt: str) -> dict:
    prompt_lower = prompt.lower()

    for category, compiled in _COMPILED_PATTERNS.items():
        for pattern in compiled:
            if pattern.search(prompt_lower):
                return {
                    "flagged": True,
                    "category": category,
                    "risk_score": RISK_SCORES[category],
                    "recommended_action": CATEGORY_ACTIONS[category],
                }

    return {
        "flagged": False,
        "category": "safe_usage",
        "risk_score": 10,
    }
