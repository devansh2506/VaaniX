"""
Pytest test suite for text_analyzer.py
Covers at least 20 sentences across Hindi script, Hinglish, and English.
"""

import pytest
import sys
from pathlib import Path

# Add voice_detection_pipeline to path
pipeline_dir = Path(__file__).resolve().parent.parent
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

from text_analyzer import analyze_text, extract_claim, normalize_text


SAMPLE_MEMBERS = [
    {"id": "m1", "name": "Rahul", "aliases": ["Bablu"], "relationship": "son"},
    {"id": "m2", "name": "Pooja", "aliases": ["Choti"], "relationship": "daughter"},
    {"id": "m3", "name": "Amit", "aliases": [], "relationship": "brother"},
    {"id": "m4", "name": "Sunita", "aliases": [], "relationship": "mother"},
]


def test_normalize_text():
    assert "rahul" in normalize_text("Main Rahul bol raha hoon!")
    assert "police" in normalize_text("THIS IS POLICE.")


# --- 20 Sentences covering diverse scam and normal scenarios ---

@pytest.mark.parametrize("sentence,expected_claim_type,expected_label", [
    # 1. Hinglish son name exact
    ("Main Rahul bol raha hoon, emergency hai", "family", "Rahul (Son)"),
    # 2. Hinglish son alias
    ("Main Bablu bol raha hoon paise bhej do", "family", "Rahul (Son)"),
    # 3. Hindi script son
    ("मैं राहुल बोल रहा हूँ, अस्पताल में हूँ", "family", "Rahul (Son)"),
    # 4. English son introduction
    ("This is Rahul, I am in big trouble please send money", "family", "Rahul (Son)"),
    # 5. Fuzzy name (1 edit distance: 'Rahol' -> 'Rahul')
    ("Main Rahol bol raha hoon mummy", "family", "Rahul (Son)"),
    # 6. Daughter name exact
    ("Main Pooja bol rahi hoon papa", "family", "Pooja (Daughter)"),
    # 7. English authority police
    ("This is Delhi Police, a warrant has been issued against your account", "authority", "Police officer"),
    # 8. Hinglish CBI authority
    ("Hum CBI se bol rahe hain, digital arrest hai aapka", "authority", "CBI officer"),
    # 9. Hindi script police
    ("पुलिस स्टेशन से इंस्पेक्टर शर्मा बोल रहा हूँ", "authority", "Police officer"),
    # 10. RBI authority
    ("Calling from RBI headquarters, your card block will happen", "authority", "RBI official"),
    # 11. TRAI authority
    ("TRAI verification department calling, sim block in 2 hours", "authority", "TRAI official"),
    # 12. Customs authority
    ("Customs officer here, a parcel has been seized in Mumbai airport", "authority", "Customs officer"),
    # 13. Bank authority
    ("Main bank manager bol raha hoon, KYC update karo", "authority", "Bank officer"),
    # 14. Relationship word 'mummy' with male verb 'gaya'
    ("Mummy accident ho gaya hai jaldi paise bhejo main hospital mein hoon", "family", "Rahul (Son)"),
    # 15. Relationship word 'papa' with female verb 'gayi'
    ("Papa main phas gayi hoon mujhe bacha lo", "family", "Pooja (Daughter)"),
    # 16. Relationship word 'bhaiya'
    ("Bhaiya turant UPI kar do 10000 rupaye", "family", "Amit (Brother)"),
    # 17. Brother introduction
    ("Main Amit bol raha hoon urgent cash chahiye", "family", "Amit (Brother)"),
    # 18. Generic son without member list
    ("Main Rohan bol raha hoon", "family", "Rohan"),
    # 19. Plain normal talk without claim
    ("Kal sham ko dinner pe aana mat bhoolna", "none", None),
    # 20. Remote access app scam
    ("Sir AnyDesk download kijiye aur screen share kariye", "none", None),
])
def test_claim_extraction_sentences(sentence, expected_claim_type, expected_label):
    claim = extract_claim(sentence, SAMPLE_MEMBERS)
    assert claim["type"] == expected_claim_type
    if expected_label:
        assert claim["label"] == expected_label


def test_scam_groups_and_scoring():
    # OTP + money + urgency
    text = "Apna OTP batao aur UPI se turant paise bhejo jaldi"
    res = analyze_text(text, SAMPLE_MEMBERS)
    assert "otp_pin" in res["groups"]
    assert "money" in res["groups"]
    assert "urgency" in res["groups"]
    # 30 (otp) + 25 (money) + 15 (urgency) = 70
    assert res["text_score"] >= 70


def test_remote_app_and_secrecy():
    text = "AnyDesk install karo aur kisi ko mat batana chupchap"
    res = analyze_text(text, SAMPLE_MEMBERS)
    assert "remote_app" in res["groups"]
    assert "secrecy" in res["groups"]
    # 30 + 20 = 50
    assert res["text_score"] >= 50


def test_score_caps_at_100():
    # Contains all groups
    text = (
        "Main Rahul bol raha hoon police cbi AnyDesk OTP pin "
        "UPI paise transfer account block jaldi emergency hospital mat batana"
    )
    res = analyze_text(text, SAMPLE_MEMBERS)
    assert res["text_score"] == 100


def test_empty_transcript():
    res = analyze_text("", SAMPLE_MEMBERS)
    assert res["text_score"] == 0
    assert res["groups"] == []
    assert res["claim"]["type"] == "none"
