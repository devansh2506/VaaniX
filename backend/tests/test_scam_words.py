import pytest
from app.services.scam_words import extract_scam_words_and_type


def test_empty_transcript():
    words, scam_type, advice = extract_scam_words_and_type("")
    assert words == []
    assert scam_type == "other"
    assert "Do not share OTP" in advice


def test_family_emergency_scam():
    text = "Mummy mera accident ho gaya hai jaldi 50000 rupaye is UPI pe bhejo kisi ko mat batana"
    words, scam_type, advice = extract_scam_words_and_type(text, has_family_claim=True)
    assert "accident" in words
    assert "upi" in words
    assert "jaldi" in words
    assert "kisi ko mat batana" in words
    assert scam_type == "family_emergency"
    assert "call them back on their real number" in advice


def test_digital_arrest_scam():
    text = "This is CBI police department. Supreme court has issued an arrest warrant. Join video call immediately for digital arrest."
    words, scam_type, advice = extract_scam_words_and_type(text)
    assert any(w in words for w in ["cbi", "police", "arrest", "digital arrest", "video call"])
    assert scam_type == "digital_arrest"
    assert "Police never arrest anyone over a phone or video call" in advice


def test_bank_kyc_scam():
    text = "Dear customer your SBI account block ho jayega. Please update KYC and tell your OTP and PIN."
    words, scam_type, advice = extract_scam_words_and_type(text)
    assert "otp" in words
    assert "pin" in words
    assert "kyc" in words
    assert scam_type == "bank_kyc"
    assert "Banks never ask for OTP, PIN or remote-access apps" in advice


def test_remote_access_scam():
    text = "Download Anydesk app quickly to verify your account"
    words, scam_type, advice = extract_scam_words_and_type(text)
    assert any(w in words for w in ["anydesk", "app download"])
