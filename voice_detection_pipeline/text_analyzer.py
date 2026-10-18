"""
Text analysis and claim extraction module for VaaniX.
Analyzes transcribed text for scam urgency keywords, authority intimidation,
and family impersonation claims.
"""

import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import yaml

# Try importing rapidfuzz, fallback to difflib
try:
    from rapidfuzz.distance import Levenshtein
    def edit_distance(s1: str, s2: str) -> int:
        return Levenshtein.distance(s1, s2)
except ImportError:
    import difflib
    def edit_distance(s1: str, s2: str) -> int:
        matcher = difflib.SequenceMatcher(None, s1, s2)
        # Approximate edit distance from similarity ratio
        return int(round((1.0 - matcher.ratio()) * max(len(s1), len(s2))))

# Try importing indic-transliteration
try:
    from indic_transliteration import sanscript
    from indic_transliteration.sanscript import SchemeMap, SCHEMES, transliterate
    HAS_INDIC = True
except ImportError:
    HAS_INDIC = False

SCAM_WORDS_PATH = Path(__file__).resolve().parent.parent / "data" / "scam_words.yaml"


def load_scam_words() -> Dict[str, Any]:
    if SCAM_WORDS_PATH.exists():
        with open(SCAM_WORDS_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("groups", {})
    return {}


_SCAM_GROUPS = load_scam_words()


def normalize_text(text: str) -> str:
    """Lowercase, optionally transliterate Devanagari to Latin, strip punctuation."""
    if not text:
        return ""
    
    text = text.lower().strip()
    
    # Transliterate Devanagari to ITRANS / Latin if indic_transliteration is present
    if HAS_INDIC and any("\u0900" <= ch <= "\u097f" for ch in text):
        try:
            translit = transliterate(text, sanscript.DEVANAGARI, sanscript.ITRANS)
            text = text + " " + translit.lower()
        except Exception:
            pass

    # Replace punctuation with spaces
    text = re.sub(r"[^\w\s\u0900-\u097f]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_claim(
    text: str,
    members: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Extract family impersonation or authority impersonation claims from transcript.
    """
    norm = normalize_text(text)
    words = norm.split()
    
    # Check Authority patterns first
    authority_keywords = {
        "police": "Police officer",
        "pulis": "Police officer",
        "पुलिस": "Police officer",
        "cbi": "CBI officer",
        "सीबीआई": "CBI officer",
        "customs": "Customs officer",
        "कस्टम्स": "Customs officer",
        "rbi": "RBI official",
        "आरबीआई": "RBI official",
        "trai": "TRAI official",
        "ट्राई": "TRAI official",
        "bank": "Bank officer",
        "inspector": "Police inspector",
        "court": "Court official",
    }
    
    for kw, label in authority_keywords.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", norm):
            return {
                "type": "authority",
                "member_id": None,
                "label": label,
                "source": "authority_keyword",
                "candidates": [],
            }

    # Name-based patterns
    # e.g., "main rahul bol raha hoon", "this is rahul", "mera naam rahul hai", "i am rahul"
    name_patterns = [
        r"main\s+([a-zA-Z\u0900-\u097f]+)\s+bol\s+rah[ai]\s+hoo?n",
        r"mai\s+([a-zA-Z\u0900-\u097f]+)\s+bol\s+rah[ai]\s+hoo?n",
        r"this\s+is\s+([a-zA-Z]+)",
        r"mera\s+naam\s+([a-zA-Z\u0900-\u097f]+)\s+hai",
        r"i\s+am\s+([a-zA-Z]+)",
        r"मैं\s+([a-zA-Z\u0900-\u097f]+)\s+बोल\s+रहा",
        r"मैं\s+([a-zA-Z\u0900-\u097f]+)\s+बोल\s+रही",
    ]

    extracted_name: Optional[str] = None
    for pattern in name_patterns:
        match = re.search(pattern, norm)
        if match:
            candidate = match.group(1).strip()
            # Ignore stop words captured as names
            if candidate not in ("aapka", "apna", "police", "bank", "nahi", "ek"):
                extracted_name = candidate
                break

    # If members list provided, attempt matching against name and aliases
    if members and extracted_name:
        cand_lower = extracted_name.lower()
        cand_variants = [cand_lower]
        if any("\u0900" <= ch <= "\u097f" for ch in cand_lower) and HAS_INDIC:
            try:
                t_val = transliterate(cand_lower, sanscript.DEVANAGARI, sanscript.ITRANS).lower()
                cand_variants.append(t_val)
                cand_variants.append(re.sub(r"a$", "", t_val))
            except Exception:
                pass

        for member in members:
            m_name = member.get("name", "").lower()
            m_aliases = [a.lower() for a in member.get("aliases", [])]
            target_names = [m_name] + m_aliases

            for cand_v in cand_variants:
                # Direct check
                if cand_v in target_names:
                    rel = member.get("relationship", "Family member")
                    return {
                        "type": "family",
                        "member_id": member.get("id"),
                        "label": f"{member.get('name')} ({rel.title()})",
                        "source": "transcript_name",
                        "candidates": [member.get("id")],
                    }
                
                # Levenshtein distance <= 1 for names >= 4 characters
                for tgt in target_names:
                    if len(cand_v) >= 4 and len(tgt) >= 4:
                        if edit_distance(cand_v, tgt) <= 1:
                            rel = member.get("relationship", "Family member")
                            return {
                                "type": "family",
                                "member_id": member.get("id"),
                                "label": f"{member.get('name')} ({rel.title()})",
                                "source": "transcript_name",
                                "candidates": [member.get("id")],
                            }

    # Relationship words check
    # e.g., "mummy", "papa", "beta", "didi"
    rel_map = {
        "mummy": ("child", "Child (Son/Daughter)"),
        "mom": ("child", "Child (Son/Daughter)"),
        "maa": ("child", "Child (Son/Daughter)"),
        "मम्मी": ("child", "Child (Son/Daughter)"),
        "papa": ("child", "Child (Son/Daughter)"),
        "dad": ("child", "Child (Son/Daughter)"),
        "पापा": ("child", "Child (Son/Daughter)"),
        "beta": ("parent", "Parent (Father/Mother)"),
        "beti": ("parent", "Parent (Father/Mother)"),
        "बेटा": ("parent", "Parent (Father/Mother)"),
        "बेटी": ("parent", "Parent (Father/Mother)"),
        "bhaiya": ("sibling", "Brother"),
        "didi": ("sibling", "Sister"),
        "dada": ("grandchild", "Grandchild"),
        "dadi": ("grandchild", "Grandchild"),
        "nana": ("grandchild", "Grandchild"),
        "nani": ("grandchild", "Grandchild"),
    }

    # Determine caller gender from gendered verb marker if present: raha -> male, rahi -> female
    gender_suffix = None
    if any(w in words for w in ("raha", "रहा", "gaya", "गया")):
        gender_suffix = "male"
    elif any(w in words for w in ("rahi", "रही", "gayi", "गई", "गयी")):
        gender_suffix = "female"

    for r_word, (inferred_role, default_label) in rel_map.items():
        if re.search(r"\b" + re.escape(r_word) + r"\b", norm):
            candidates = []
            matched_member = None
            
            if members:
                for m in members:
                    m_rel = m.get("relationship", "").lower()
                    if inferred_role == "child" and m_rel in ("son", "daughter"):
                        if gender_suffix == "male" and m_rel == "son":
                            matched_member = m
                        elif gender_suffix == "female" and m_rel == "daughter":
                            matched_member = m
                        candidates.append(m.get("id"))
                    elif inferred_role == "sibling" and m_rel in ("brother", "sister"):
                        candidates.append(m.get("id"))
                    elif inferred_role == "parent" and m_rel in ("father", "mother"):
                        candidates.append(m.get("id"))

                if matched_member:
                    rel = matched_member.get("relationship", "").title()
                    return {
                        "type": "family",
                        "member_id": matched_member.get("id"),
                        "label": f"{matched_member.get('name')} ({rel})",
                        "source": "transcript_relation",
                        "candidates": candidates,
                    }
                elif candidates and len(candidates) == 1:
                    # Exactly one candidate matched
                    cand_id = candidates[0]
                    cand = next(m for m in members if m.get("id") == cand_id)
                    return {
                        "type": "family",
                        "member_id": cand.get("id"),
                        "label": f"{cand.get('name')} ({cand.get('relationship', '').title()})",
                        "source": "transcript_relation",
                        "candidates": candidates,
                    }

            label = default_label
            if inferred_role == "child" and gender_suffix == "male":
                label = "Son"
            elif inferred_role == "child" and gender_suffix == "female":
                label = "Daughter"

            return {
                "type": "family",
                "member_id": None,
                "label": label,
                "source": "transcript_relation",
                "candidates": candidates,
            }

    if extracted_name:
        return {
            "type": "family",
            "member_id": None,
            "label": extracted_name.capitalize(),
            "source": "transcript_name",
            "candidates": [],
        }

    return {
        "type": "none",
        "member_id": None,
        "label": None,
        "source": "none",
        "candidates": [],
    }


def analyze_text(
    transcript: str,
    members: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Score transcript against scam-word groups and extract identity claims.
    Returns:
    {
        "groups": ["money", "urgency"],
        "matched_words": ["upi", "jaldi"],
        "text_score": int (0-100),
        "claim": {...}
    }
    """
    if not transcript or not transcript.strip():
        return {
            "groups": [],
            "matched_words": [],
            "text_score": 0,
            "claim": {
                "type": "none",
                "member_id": None,
                "label": None,
                "source": "none",
                "candidates": [],
            },
        }

    norm = normalize_text(transcript)
    matched_groups: List[str] = []
    matched_words: List[str] = []
    score = 0

    scam_groups = _SCAM_GROUPS or load_scam_words()

    for grp_name, grp_data in scam_groups.items():
        weight = grp_data.get("weight", 0)
        words_list = grp_data.get("words", [])
        
        grp_matched = False
        for word in words_list:
            norm_word = normalize_text(word)
            if re.search(r"\b" + re.escape(norm_word) + r"\b", norm):
                if not grp_matched:
                    matched_groups.append(grp_name)
                    score += weight
                    grp_matched = True
                if word not in matched_words:
                    matched_words.append(word)

    claim = extract_claim(transcript, members)
    if claim.get("type") in ("family", "authority"):
        if "claimed_identity" not in matched_groups:
            matched_groups.append("claimed_identity")
            score += 15

    final_score = min(score, 100)

    return {
        "groups": matched_groups,
        "matched_words": matched_words,
        "text_score": final_score,
        "claim": claim,
    }
