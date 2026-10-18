import pytest
from app.services.telegram_bot import (
    generate_redirect_signature,
    verify_redirect_signature,
)


def test_hmac_signature_generation_and_verification():
    alert_id = "test-alert-uuid-1234"
    action = "cyber"

    sig = generate_redirect_signature(alert_id, action)
    assert isinstance(sig, str)
    assert len(sig) == 64  # SHA-256 hex string

    # Verification happy path
    assert verify_redirect_signature(alert_id, action, sig) is True

    # Tampered action
    assert verify_redirect_signature(alert_id, "bank", sig) is False

    # Tampered alert_id
    assert verify_redirect_signature("other-uuid", action, sig) is False

    # Tampered signature
    assert verify_redirect_signature(alert_id, action, sig[:-2] + "00") is False
