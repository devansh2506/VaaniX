import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import yaml

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RELATIONSHIPS_FILE = DATA_DIR / "relationships.yaml"

_relationships_data: Dict[str, Any] | None = None


def load_relationships() -> Dict[str, Any]:
    global _relationships_data
    if _relationships_data is not None:
        return _relationships_data

    if not RELATIONSHIPS_FILE.exists():
        return {}

    with open(RELATIONSHIPS_FILE, "r", encoding="utf-8") as f:
        _relationships_data = yaml.safe_load(f) or {}
    return _relationships_data


def get_prop(obj: Any, prop: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        val = obj.get(prop, default)
    else:
        val = getattr(obj, prop, default)
    return val if val is not None else default


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates Levenshtein edit distance between two strings."""
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2:
        return 0
    if len(s1) == 0:
        return len(s2)
    if len(s2) == 0:
        return len(s1)

    v0 = list(range(len(s2) + 1))
    v1 = [0] * (len(s2) + 1)

    for i in range(len(s1)):
        v1[0] = i + 1
        for j in range(len(s2)):
            cost = 0 if s1[i] == s2[j] else 1
            v1[j + 1] = min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
        v0 = list(v1)

    return v0[len(s2)]


def is_name_fuzzy_match(extracted_name: str, candidate_name: str) -> bool:
    extracted = extracted_name.lower().strip()
    candidate = candidate_name.lower().strip()
    if not extracted or not candidate:
        return False

    if extracted == candidate:
        return True

    # Levenshtein distance <= 1 for names >= 4 letters
    if len(candidate) >= 4 and len(extracted) >= 3:
        if levenshtein_distance(extracted, candidate) <= 1:
            return True

    return False


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"[^\d+]", "", phone)
    if not digits.startswith("+") and len(digits) == 10:
        digits = "+91" + digits
    return digits


# Devanagari to Latin phonetic approximations for common name patterns
DEVANAGARI_MAP = {
    "राहुल": "rahul",
    "रोहन": "rohan",
    "अमित": "amit",
    "सुनीता": "sunita",
    "अंजलि": "anjali",
    "प्रिया": "priya",
    "विकास": "vikas",
    "पूजा": "pooja",
    "बिट्टू": "bittu",
    "सोनू": "sonu",
}


def extract_claimed_identity(
    transcript: str | None,
    caller_number: str | None,
    family_members: List[Any],
) -> Dict[str, Any]:
    """
    Extracts who the caller claims to be based on:
    1. Name mentioned in transcript
    2. Relationship words used + gender hints
    3. Caller phone number matching family records
    4. Authority claim detection
    """
    result = {
        "claimed_member_id": None,
        "claimed_identity_text": None,
        "claim_source": None,
        "candidates": [],
        "confidence": 0.0,
    }

    if not transcript and not caller_number:
        return result

    norm_caller = normalize_phone(caller_number) if caller_number else ""
    text = (transcript or "").strip()
    text_lower = text.lower()

    # Expand common devanagari names in text for transliteration fallback
    for dev, lat in DEVANAGARI_MAP.items():
        if dev in text:
            text_lower += f" {lat}"

    rel_data = load_relationships()
    male_markers = set(rel_data.get("gender_markers", {}).get("male", []))
    female_markers = set(rel_data.get("gender_markers", {}).get("female", []))

    detected_gender: Optional[str] = None
    for word in text_lower.split():
        if word in male_markers:
            detected_gender = "male"
            break
        elif word in female_markers:
            detected_gender = "female"
            break

    # -------------------------------------------------------------
    # RULE 1: Name in transcript
    # -------------------------------------------------------------
    name_patterns = [
        r"(?:main|mai|me|mein)\s+([a-zA-Z\u0900-\u097F]+)\s+(?:bol|baat)\s+(?:raha|rahi|rha|rhi)\s+(?:hoon|hu|hun)",
        r"(?:this\s+is|it's|its|it\s+is|i\s+am|i'm)\s+([a-zA-Z\u0900-\u097F]+)",
        r"([a-zA-Z\u0900-\u097F]+)\s+(?:here|bol\s+raha|bol\s+rahi)",
        r"(?:mera|meri)\s+naam\s+([a-zA-Z\u0900-\u097F]+)\s+hai",
        r"(?:main|mein)\s+([a-zA-Z\u0900-\u097F]+)\s+hoon",
        r"(?:मैं|मै)\s+([a-zA-Z\u0900-\u097F]+)\s+बोल\s+(?:रहा|रही)\s+हूँ",
        r"मेरा\s+नाम\s+([a-zA-Z\u0900-\u097F]+)\s+है",
    ]

    extracted_names = []
    for pat in name_patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            clean_m = m.strip()
            # If devanagari name has a mapping, also append Latin
            if clean_m in DEVANAGARI_MAP:
                extracted_names.append(DEVANAGARI_MAP[clean_m])
            if len(clean_m) >= 2 and clean_m.lower() not in {"police", "officer", "bank", "cbi"}:
                extracted_names.append(clean_m)

    # Check extracted names against family members
    for name_candidate in extracted_names:
        for member in family_members:
            m_id = get_prop(member, "id")
            m_name = get_prop(member, "name", "")
            m_aliases = get_prop(member, "aliases", [])
            m_rel = get_prop(member, "relationship_type", "Family")

            candidate_aliases = [m_name] + list(m_aliases)
            for alias in candidate_aliases:
                if is_name_fuzzy_match(name_candidate, alias):
                    result["claimed_member_id"] = str(m_id)
                    result["claimed_identity_text"] = f"{m_name} ({m_rel.capitalize()})"
                    result["claim_source"] = "transcript_name"
                    result["confidence"] = 0.95
                    return result

    # -------------------------------------------------------------
    # RULE 2: Relationship words used in transcript
    # -------------------------------------------------------------
    candidate_relations: List[str] = []

    for group_name in ["parent_terms", "child_terms", "sibling_terms", "grandparent_terms", "spouse_terms"]:
        group = rel_data.get(group_name, {})
        terms = group.get("terms", [])
        mapped = group.get("maps_to_caller_relation", [])

        for term in terms:
            escaped = re.escape(term.lower())
            if re.search(r'(?:\b|\W|^)' + escaped + r'(?:\b|\W|$)', text_lower, re.IGNORECASE):
                candidate_relations.extend(mapped)

    if candidate_relations:
        candidate_relations = list(dict.fromkeys(candidate_relations))  # unique preserving order

        # Filter members matching candidate relationships
        matching_members = []
        for member in family_members:
            m_rel = str(get_prop(member, "relationship_type", "")).lower()
            if m_rel in candidate_relations:
                matching_members.append(member)

        # Narrow with gender marker if possible
        if detected_gender and len(matching_members) > 1:
            gender_filtered = []
            for m in matching_members:
                m_rel = str(get_prop(m, "relationship_type", "")).lower()
                if detected_gender == "male" and m_rel in {"son", "father", "brother", "husband", "grandson"}:
                    gender_filtered.append(m)
                elif detected_gender == "female" and m_rel in {"daughter", "mother", "sister", "wife", "granddaughter"}:
                    gender_filtered.append(m)
            if gender_filtered:
                matching_members = gender_filtered

        if len(matching_members) == 1:
            matched = matching_members[0]
            m_id = get_prop(matched, "id")
            m_name = get_prop(matched, "name")
            m_rel = get_prop(matched, "relationship_type", "Family")
            result["claimed_member_id"] = str(m_id)
            result["claimed_identity_text"] = f"{m_name} ({m_rel.capitalize()})"
            result["claim_source"] = "transcript_relation"
            result["confidence"] = 0.85
            return result
        elif len(matching_members) > 1:
            result["candidates"] = [
                {
                    "id": str(get_prop(m, "id")),
                    "name": get_prop(m, "name"),
                    "relationship": get_prop(m, "relationship_type"),
                }
                for m in matching_members
            ]
            result["claim_source"] = "transcript_relation"
            result["claimed_identity_text"] = "Family Member"
            result["confidence"] = 0.60
            return result

    # -------------------------------------------------------------
    # RULE 3: Caller Number Match
    # -------------------------------------------------------------
    if norm_caller:
        for member in family_members:
            m_phone = get_prop(member, "phone_e164", "")
            if normalize_phone(m_phone) == norm_caller:
                m_id = get_prop(member, "id")
                m_name = get_prop(member, "name")
                m_rel = get_prop(member, "relationship_type", "Family")
                result["claimed_member_id"] = str(m_id)
                result["claimed_identity_text"] = f"{m_name} ({m_rel.capitalize()})"
                result["claim_source"] = "caller_number"
                result["confidence"] = 0.90
                return result

    # -------------------------------------------------------------
    # RULE 5: Authority Claims (No family member)
    # -------------------------------------------------------------
    authority_keywords = [
        (r"\b(sbi|hdfc|icici|rbi|bank|branch manager|bank manager)\b", "Bank Officer"),
        (r"\b(police|inspector|dsp|sho|thana|sub inspector)\b", "Police Officer"),
        (r"\b(cbi|central bureau)\b", "CBI Officer"),
        (r"\b(customs|custom officer|airport customs)\b", "Customs Officer"),
        (r"\b(trai|telecom authority)\b", "TRAI Official"),
        (r"\b(cyber cell|cyber police)\b", "Cyber Cell Officer"),
        (r"\b(income tax|it department|tax officer)\b", "Income Tax Officer"),
        (r"\b(fedex|dhl|courier)\b", "Courier Service Agent"),
    ]

    for pat, label in authority_keywords:
        if re.search(pat, text_lower):
            result["claimed_identity_text"] = label
            result["claim_source"] = "authority_keyword"
            result["confidence"] = 0.75
            return result

    return result
