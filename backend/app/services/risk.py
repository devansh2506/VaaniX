from typing import List, Tuple
from app.config import settings

def calculate_verdict(p_spoofs: List[float], force_verdict: str | None = None) -> Tuple[int, str, str]:
    """
    Computes overall risk score (0..100), verdict (AI_CLONE | REAL | INCONCLUSIVE),
    and risk band (low | elevated | high | critical).
    """
    if force_verdict == "AI_CLONE":
        risk_score = 87
        verdict = "AI_CLONE"
    elif force_verdict == "REAL":
        risk_score = 14
        verdict = "REAL"
    else:
        if not p_spoofs:
            p_spoofs = [0.1]
        mean_p = sum(p_spoofs) / len(p_spoofs)
        risk_score = round(mean_p * 100)
        risk_score = max(0, min(100, risk_score))

        if risk_score >= settings.AI_THRESHOLD:
            verdict = "AI_CLONE"
        elif risk_score <= settings.REAL_THRESHOLD:
            verdict = "REAL"
        else:
            verdict = "INCONCLUSIVE"

    # Risk band calculation
    if risk_score >= 85:
        risk_band = "critical"
    elif risk_score >= 60:
        risk_band = "high"
    elif risk_score >= 30:
        risk_band = "elevated"
    else:
        risk_band = "low"

    return risk_score, verdict, risk_band
