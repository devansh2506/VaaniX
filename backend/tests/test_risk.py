import pytest
from app.services.risk import calculate_verdict


def test_ai_clone_threshold():
    # Mean > 0.60
    p_spoofs = [0.85, 0.90, 0.88]
    score, verdict, band = calculate_verdict(p_spoofs)
    assert score == 88
    assert verdict == "AI_CLONE"
    assert band == "critical"


def test_real_threshold():
    # Mean < 0.40
    p_spoofs = [0.10, 0.15, 0.05]
    score, verdict, band = calculate_verdict(p_spoofs)
    assert score == 10
    assert verdict == "REAL"
    assert band == "low"


def test_inconclusive_threshold():
    # Between 0.40 and 0.60
    p_spoofs = [0.45, 0.52, 0.50]
    score, verdict, band = calculate_verdict(p_spoofs)
    assert score == 49
    assert verdict == "INCONCLUSIVE"
    assert band == "elevated"


def test_force_verdict():
    score, verdict, band = calculate_verdict([0.1], force_verdict="AI_CLONE")
    assert verdict == "AI_CLONE"
    assert score == 87

    score, verdict, band = calculate_verdict([0.9], force_verdict="REAL")
    assert verdict == "REAL"
    assert score == 14
