import pytest
from app.services.claims import (
    extract_claimed_identity,
    is_name_fuzzy_match,
    levenshtein_distance,
)


class MockMember:
    def __init__(self, id, name, relationship_type, phone_e164, aliases=None):
        self.id = id
        self.name = name
        self.relationship_type = relationship_type
        self.phone_e164 = phone_e164
        self.aliases = aliases or []


@pytest.fixture
def sample_family():
    return [
        MockMember("m1", "Rahul", "son", "+919811122233", ["Bittu", "Rahu"]),
        MockMember("m2", "Priya", "daughter", "+919822233344", ["Guddi"]),
        MockMember("m3", "Suresh", "husband", "+919833344455"),
        MockMember("m4", "Aarav", "grandson", "+919844455566"),
    ]


def test_levenshtein_distance():
    assert levenshtein_distance("rahul", "rahul") == 0
    assert levenshtein_distance("rahul", "rahol") == 1
    assert levenshtein_distance("priya", "priyaa") == 1
    assert levenshtein_distance("test", "") == 4


def test_fuzzy_match():
    assert is_name_fuzzy_match("rahul", "rahul") is True
    assert is_name_fuzzy_match("rahol", "rahul") is True
    assert is_name_fuzzy_match("priyaa", "priya") is True
    assert is_name_fuzzy_match("different", "rahul") is False


# 20+ test cases covering Hinglish, Hindi script, English, relationships, and authorities
@pytest.mark.parametrize(
    "transcript,caller_number,expected_source,expected_text",
    [
        # Name patterns (Hinglish)
        ("Mummy main Rahul bol raha hoon accident ho gaya", "+917777777777", "transcript_name", "Rahul (Son)"),
        ("Mummy mai Rahu bol raha hu jaldi paise bhejo", "+917777777777", "transcript_name", "Rahul (Son)"),
        ("Hey this is Rahul here please help me", "+917777777777", "transcript_name", "Rahul (Son)"),
        ("Mera naam Bittu hai papa", "+917777777777", "transcript_name", "Rahul (Son)"),
        ("Papa main Priya bol rahi hoon urgent", "+917777777777", "transcript_name", "Priya (Daughter)"),
        ("This is Guddi here", "+917777777777", "transcript_name", "Priya (Daughter)"),
        
        # Name patterns (Hindi Devanagari)
        ("मम्मी मैं राहुल बोल रहा हूँ चोट लग गई", "+917777777777", "transcript_name", "Rahul (Son)"),
        ("पापा मैं प्रिया बोल रही हूँ मदद करो", "+917777777777", "transcript_name", "Priya (Daughter)"),
        ("मेरा नाम राहुल है", "+917777777777", "transcript_name", "Rahul (Son)"),

        # Relationship patterns with gender narrowing
        ("Mummy main bol raha hoon mera accident ho gaya", "+917777777777", "transcript_relation", "Rahul (Son)"),
        ("Mummy main bol rahi hoon hospital mein hoon", "+917777777777", "transcript_relation", "Priya (Daughter)"),
        ("Papa ambulance mein hoon bahut dard ho raha hai", "+917777777777", "transcript_relation", "Rahul (Son)"),
        ("Dadi main gira hua hoon emergency hai", "+917777777777", "transcript_relation", "Aarav (Grandson)"),
        ("Suno main bol raha hoon card block ho gaya", "+917777777777", "transcript_relation", "Suresh (Husband)"),

        # Caller number match (e.g. caller ID spoofing with real member number)
        ("Hello can you hear me send money", "+919811122233", "caller_number", "Rahul (Son)"),
        ("Please pick up urgently", "+919822233344", "caller_number", "Priya (Daughter)"),
        ("Emergency at home", "+919833344455", "caller_number", "Suresh (Husband)"),

        # Authority claims (No family claim)
        ("This is SBI bank manager your card is blocked", "+917777777777", "authority_keyword", "Bank Officer"),
        ("Police inspector Sharma from Delhi police thana", "+917777777777", "authority_keyword", "Police Officer"),
        ("CBI officer here regarding a digital arrest warrant", "+917777777777", "authority_keyword", "CBI Officer"),
        ("Customs officer calling regarding illegal parcel from FedEx", "+917777777777", "authority_keyword", "Customs Officer"),
        ("TRAI official your mobile number will be disconnected in 2 hours", "+917777777777", "authority_keyword", "TRAI Official"),
        ("Income tax department notice issued against your PAN", "+917777777777", "authority_keyword", "Income Tax Officer"),
    ],
)
def test_claims_extraction(sample_family, transcript, caller_number, expected_source, expected_text):
    result = extract_claimed_identity(transcript, caller_number, sample_family)
    assert result["claim_source"] == expected_source
    assert result["claimed_identity_text"] == expected_text
