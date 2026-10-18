import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
import yaml

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SCAM_WORDS_FILE = DATA_DIR / "scam_words.yaml"

_cached_keywords: Dict[str, List[str]] | None = None

ADVICE_MAP = {
    "family_emergency": "Hang up and call them back on their real number.",
    "digital_arrest": "Police never arrest anyone over a phone or video call.",
    "bank_kyc": "Banks never ask for OTP, PIN or remote-access apps.",
    "other": "Do not share OTP or send money to this caller.",
}

def load_scam_keywords() -> Dict[str, List[str]]:
    global _cached_keywords
    if _cached_keywords is not None:
        return _cached_keywords

    if not SCAM_WORDS_FILE.exists():
        return {}

    with open(SCAM_WORDS_FILE, "r", encoding="utf-8") as f:
        _cached_keywords = yaml.safe_load(f) or {}
    return _cached_keywords


def extract_scam_words_and_type(
    transcript: str | None,
    has_family_claim: bool = False,
) -> Tuple[List[str], str, str]:
    """
    Extracts matched scam words, determines scam type, and provides advice line.
    Returns: (matched_words, scam_type, advice_line)
    """
    if not transcript:
        return [], "other", ADVICE_MAP["other"]

    keywords = load_scam_keywords()
    normalized_text = transcript.lower()

    matched_by_category: Dict[str, List[str]] = {}
    all_matched_words: List[str] = []

    for category, word_list in keywords.items():
        matched_in_cat = []
        for word in word_list:
            # Word boundary check for latin or direct substring for devanagari/phrases
            escaped = re.escape(word.lower())
            if re.search(r'(?:\b|\W|^)' + escaped + r'(?:\b|\W|$)', normalized_text, re.IGNORECASE):
                matched_in_cat.append(word)
                if word not in all_matched_words:
                    all_matched_words.append(word)
        if matched_in_cat:
            matched_by_category[category] = matched_in_cat

    # Deduplicated, max 8
    final_scam_words = all_matched_words[:8]

    # Rule-based scam type determination
    has_authority = "authority" in matched_by_category
    has_accident = "accident" in matched_by_category
    has_money = "money" in matched_by_category
    has_otp = "otp_pin" in matched_by_category
    has_kyc = "kyc" in matched_by_category

    # Check for arrest/warrant/video call in authority/accident
    arrest_terms = {"arrest", "warrant", "video call", "digital arrest", "skype", "अरेस्ट", "वारंट", "डिजिटल अरेस्ट"}
    has_arrest_signal = False
    for cat in ["authority", "accident"]:
        for w in matched_by_category.get(cat, []):
            if any(term in w.lower() for term in arrest_terms):
                has_arrest_signal = True
                break

    if has_authority and has_arrest_signal:
        scam_type = "digital_arrest"
    elif has_kyc or (has_authority and has_otp):
        scam_type = "bank_kyc"
    elif has_family_claim or (has_accident and has_money):
        scam_type = "family_emergency"
    elif has_money or has_otp:
        scam_type = "bank_kyc"
    else:
        scam_type = "other"

    advice = ADVICE_MAP.get(scam_type, ADVICE_MAP["other"])
    return final_scam_words, scam_type, advice
