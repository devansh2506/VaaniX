import io
import wave
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.db.session import init_db


def create_dummy_wav(duration_s=6.0, sample_rate=16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        raw_pcm = b"\x10\x00\x20\x00\x10\x00\x00\x00" * int(duration_s * sample_rate / 4)
        wf.writeframes(raw_pcm)
    return buf.getvalue()


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["api"] == "ok"
        assert data["db"] == "ok"
        assert "model" in data


@pytest.mark.asyncio
async def test_dev_login_and_analyze_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Dev login
        login_res = await client.post(
            "/v1/auth/dev-login",
            json={"phone": "+919876543210", "display_name": "Test User"},
        )
        assert login_res.status_code == 200
        auth_data = login_res.json()
        token = auth_data["access_token"]
        assert token is not None

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Lookup radar (should succeed)
        radar_res = await client.get("/v1/radar/lookup?number=%2B919876543210", headers=headers)
        assert radar_res.status_code == 200
        assert "level" in radar_res.json()

        # 3. Analyze Audio
        dummy_wav = create_dummy_wav(duration_s=7.0)
        files = {"audio": ("sample.wav", dummy_wav, "audio/wav")}
        data = {"caller_number": "+919876543210", "direction": "incoming"}

        analyze_res = await client.post("/v1/analyze", files=files, data=data, headers=headers)
        assert analyze_res.status_code == 200
        res_data = analyze_res.json()

        assert "call_id" in res_data
        assert "verdict" in res_data
        assert "risk_score" in res_data
        assert "scam_type" in res_data
        assert "advice" in res_data
        assert len(res_data["window_scores"]) == 3


@pytest.mark.asyncio
async def test_family_groups_and_telegram_join():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login
        login = await client.post("/v1/auth/dev-login", json={"phone": "+919111111111", "display_name": "Mom"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create Group
        grp_res = await client.post("/v1/groups", json={"name": "Sharma Family"}, headers=headers)
        assert grp_res.status_code == 200
        group = grp_res.json()
        group_id = group["id"]

        # Add member
        mem_res = await client.post(
            f"/v1/groups/{group_id}/members",
            json={
                "name": "Rahul",
                "relationship": "son",
                "phone": "+919222222222",
                "aliases": ["Rahu", "Bittu"],
            },
            headers=headers,
        )
        assert mem_res.status_code == 200
        member = mem_res.json()
        assert member["name"] == "Rahul"
        assert member["invite_link"].startswith("https://t.me/")

        # Extract token from invite_link
        join_token = member["invite_link"].split("?start=m_")[1]

        # Simulate Telegram /start m_<token>
        webhook_res = await client.post(
            "/v1/telegram/webhook",
            json={
                "message": {
                    "chat": {"id": 123456789},
                    "text": f"/start m_{join_token}",
                }
            },
        )
        assert webhook_res.status_code == 200

        # Verify member is marked joined
        mine_res = await client.get("/v1/groups/mine", headers=headers)
        assert mine_res.status_code == 200
        mine = mine_res.json()
        joined_member = next(m for m in mine["members"] if m["id"] == member["id"])
        assert joined_member["telegram_joined"] is True


@pytest.mark.asyncio
async def test_radar_reporting_and_threshold():
    import uuid
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        test_suffix = uuid.uuid4().hex[:8]
        target_number = f"+9188{test_suffix}"

        # Check initial radar
        r0 = await client.get("/v1/radar/lookup", params={"number": target_number})
        assert r0.status_code == 200
        assert r0.json()["level"] == "none"

        # Report from user 1
        u1 = await client.post("/v1/auth/dev-login", json={"phone": f"+9191{test_suffix}"})
        h1 = {"Authorization": f"Bearer {u1.json()['access_token']}"}
        rep1 = await client.post("/v1/radar/report", json={"number": target_number, "reason": "user_report"}, headers=h1)
        assert rep1.status_code == 204

        # Radar now caution (1 reporter)
        r1 = await client.get("/v1/radar/lookup", params={"number": target_number})
        assert r1.json()["level"] == "caution"
        assert r1.json()["distinct_reporters_24h"] == 1

        # Report again from user 1 (should dedupe)
        await client.post("/v1/radar/report", json={"number": target_number, "reason": "user_report"}, headers=h1)
        r1_dedupe = await client.get("/v1/radar/lookup", params={"number": target_number})
        assert r1_dedupe.json()["distinct_reporters_24h"] == 1

        # Report from user 2 and user 3
        u2 = await client.post("/v1/auth/dev-login", json={"phone": f"+9192{test_suffix}"})
        h2 = {"Authorization": f"Bearer {u2.json()['access_token']}"}
        await client.post("/v1/radar/report", json={"number": target_number, "reason": "user_report"}, headers=h2)

        u3 = await client.post("/v1/auth/dev-login", json={"phone": f"+9193{test_suffix}"})
        h3 = {"Authorization": f"Bearer {u3.json()['access_token']}"}
        await client.post("/v1/radar/report", json={"number": target_number, "reason": "user_report"}, headers=h3)

        # Radar now potential_scam (>= 3 distinct reporters)
        r3 = await client.get("/v1/radar/lookup", params={"number": target_number})
        assert r3.json()["level"] == "potential_scam"
        assert r3.json()["distinct_reporters_24h"] == 3


@pytest.mark.asyncio
async def test_evidence_verification_and_complaint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login
        u = await client.post("/v1/auth/dev-login", json={"phone": "+919876543219"})
        token = u.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Submit audio for analyze with FORCE_VERDICT
        dummy_wav = create_dummy_wav(duration_s=8.0)
        from app.config import settings
        settings.FORCE_VERDICT = "AI_CLONE"

        files = {"audio": ("evidence_test.wav", dummy_wav, "audio/wav")}
        data = {"caller_number": "+919999888877", "direction": "incoming"}
        analyze_res = await client.post("/v1/analyze", files=files, data=data, headers=headers)
        assert analyze_res.status_code == 200
        call_info = analyze_res.json()
        assert call_info["verdict"] == "AI_CLONE"
        call_id = call_info["call_id"]
        sha256 = call_info["evidence_sha256"]
        assert sha256 is not None

        # Verify evidence
        verify_files = {"audio": ("verify.wav", dummy_wav, "audio/wav")}
        verify_res = await client.post(
            "/v1/evidence/verify",
            data={"call_id": call_id},
            files=verify_files,
            headers=headers,
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["match"] is True

        # Test structured complaint creation
        comp_payload = {
            "type": "AI_VOICE_CLONE_FRAUD",
            "victim": {"name": "Test Victim", "phone": "+919876543219", "state": "DL"},
            "incident": {
                "time": "2026-10-18T10:00:00Z",
                "caller_number": "+919999888877",
                "risk_score": 90,
                "scam_words": ["upi", "accident"],
                "family_confirmation": "no_scam",
            },
            "evidence": {"audio_sha256": sha256, "evidence_url": f"/v1/evidence/{call_id}"},
        }
        comp_res = await client.post("/v1/complaint", json=comp_payload, headers=headers)
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        comp_id = comp_data["complaint_id"]

        get_comp = await client.get(f"/v1/complaint/{comp_id}", headers=headers)
        assert get_comp.status_code == 200
        assert get_comp.json()["complaint_id"] == comp_id

