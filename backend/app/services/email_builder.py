import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import yaml

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CYBER_CELLS_FILE = DATA_DIR / "cyber_cells.yaml"
BANKS_FILE = DATA_DIR / "banks.yaml"

_cyber_cells_cache = None
_banks_cache = None


def load_cyber_cells() -> Dict[str, Any]:
    global _cyber_cells_cache
    if _cyber_cells_cache is None and CYBER_CELLS_FILE.exists():
        with open(CYBER_CELLS_FILE, "r", encoding="utf-8") as f:
            _cyber_cells_cache = yaml.safe_load(f) or {}
    return _cyber_cells_cache or {}


def load_banks() -> Dict[str, Any]:
    global _banks_cache
    if _banks_cache is None and BANKS_FILE.exists():
        with open(BANKS_FILE, "r", encoding="utf-8") as f:
            _banks_cache = yaml.safe_load(f) or {}
    return _banks_cache or {}


def build_complaint_email(
    target: str,  # 'cyber_cell' | 'bank'
    alert: Any,
    call: Any,
    user: Any,
    impersonated_member: Optional[Any] = None,
) -> Dict[str, str]:
    """
    Builds structured complaint subject and plain text body with target email.
    Returns: {"to": str, "subject": str, "body": str, "mailto_url": str}
    """
    # 1. Determine Recipient Email
    to_email = ""
    if target in ("cyber_cell", "cyber"):
        state_code = (getattr(user, "state_code", "") or "DL").upper()
        cells = load_cyber_cells()
        cell_info = cells.get(state_code, cells.get("OTHER", {}))
        to_email = cell_info.get("email", "")
    elif target in ("bank", "banking"):
        bank_code = (getattr(user, "bank_code", "") or "SBI").upper()
        banks = load_banks()
        bank_info = banks.get(bank_code, banks.get("OTHER", {}))
        to_email = bank_info.get("fraud_email", "")

    # Format timestamp
    call_time = getattr(call, "started_at", None) or datetime.now(timezone.utc)
    if isinstance(call_time, str):
        time_str = call_time
    else:
        time_str = call_time.strftime("%d %b %Y, %I:%M %p UTC")

    caller_number = getattr(call, "caller_e164", "Unknown")
    claimed_text = getattr(call, "claimed_identity_text", "Unknown Caller") or "Unknown"
    risk_score = getattr(call, "risk_score", 0)
    scam_words = getattr(call, "scam_words", []) or []
    words_str = ", ".join(scam_words) if scam_words else "None detected"
    transcript = (getattr(call, "transcript", "") or "").strip()
    if len(transcript) > 400:
        transcript = transcript[:397] + "..."

    alert_id = getattr(alert, "id", "N/A")
    audio_sha256 = getattr(call, "audio_sha256", "N/A") or "N/A"
    user_name = getattr(user, "display_name", "Citizen") or "Citizen"
    user_phone = getattr(user, "phone_e164", "")

    # Confirmation status
    imp_resp = getattr(alert, "impersonated_response", None)
    confirmation_line = ""
    if imp_resp == "no_scam" and impersonated_member:
        m_name = getattr(impersonated_member, "name", "Family member")
        confirmation_line = f"- Family member confirmation: {m_name} confirmed it was NOT them on the call.\n"
    elif imp_resp == "yes_its_me" and impersonated_member:
        m_name = getattr(impersonated_member, "name", "Family member")
        confirmation_line = f"- Family member confirmation: {m_name} verified identity.\n"

    # Subject
    date_label = call_time.strftime("%d %b %Y") if hasattr(call_time, "strftime") else "Recent Call"
    subject = f"Complaint: AI voice-clone fraud call from {caller_number} on {date_label}"

    # Body
    body_lines = [
        "Respected Sir/Madam,",
        "",
        f"I am writing to report a fraudulent phone call in which the caller used an AI-cloned voice attempting impersonation and financial fraud.",
        "",
        "Details:",
        f"- Date and time: {time_str}",
        f"- Caller number: {caller_number}",
        f"- Claimed identity: {claimed_text}",
        f"- SatyaVoice AI risk score: {risk_score} / 100 (AI-cloned voice detected)",
    ]

    if confirmation_line:
        body_lines.append(confirmation_line.strip())

    body_lines.extend([
        f"- Keywords detected: {words_str}",
        f"- Audio transcript (seconds 5–15): \"{transcript}\"",
        f"- Forensic evidence reference: SatyaVoice Alert ID {alert_id}",
        f"- Audio SHA-256 hash: {audio_sha256}",
    ])

    if target in ("bank", "banking"):
        body_lines.extend([
            "",
            "REQUEST TO BANK:",
            "Please flag/freeze any unauthorized transaction or transfer to the suspected beneficiary if payment was initiated, and alert my account for suspicious activity.",
        ])

    body_lines.extend([
        "",
        f"Complainant Name: {user_name}",
        f"Complainant Phone: {user_phone}",
        "",
        "You can also report this incident online at https://cybercrime.gov.in or call national helpline 1930.",
        "",
        "Generated securely by SatyaVoice Anti-Impersonation System. The cryptographic audio evidence can be produced upon official request.",
    ])

    body_text = "\n".join(body_lines)

    # Encode for mailto:
    encoded_subj = urllib.parse.quote(subject)
    encoded_body = urllib.parse.quote(body_text)
    mailto_url = f"mailto:{to_email}?subject={encoded_subj}&body={encoded_body}"

    return {
        "to": to_email,
        "subject": subject,
        "body": body_text,
        "mailto_url": mailto_url,
    }
