import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.session import Base
from app.db.models import User, RadarReport, Feedback, Call
from app.services.radar import add_radar_report, lookup_number_radar


@pytest_asyncio.fixture
async def async_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_radar_lifecycle_and_levels(async_db: AsyncSession):
    # Setup users
    u1 = User(id="u1", phone_e164="+919999900001", display_name="User 1")
    u2 = User(id="u2", phone_e164="+919999900002", display_name="User 2")
    u3 = User(id="u3", phone_e164="+919999900003", display_name="User 3")
    async_db.add_all([u1, u2, u3])
    await async_db.commit()

    target_number = "+919876543210"

    # Initial lookup: level none
    res0 = await lookup_number_radar(async_db, target_number)
    assert res0["level"] == "none"
    assert res0["distinct_reporters_24h"] == 0

    # User 1 reports
    r1 = await add_radar_report(async_db, target_number, u1.id, "user_report")
    assert r1 is not None

    # Duplicate report by same user should be ignored
    r1_dup = await add_radar_report(async_db, target_number, u1.id, "user_report")
    assert r1_dup is None

    # Lookup after 1 report: level caution
    res1 = await lookup_number_radar(async_db, target_number)
    assert res1["level"] == "caution"
    assert res1["distinct_reporters_24h"] == 1

    # User 2 reports
    await add_radar_report(async_db, target_number, u2.id, "ai_flag")

    # User 3 reports -> hits RADAR_THRESHOLD (3) -> level potential_scam
    await add_radar_report(async_db, target_number, u3.id, "user_report")

    res3 = await lookup_number_radar(async_db, target_number)
    assert res3["level"] == "potential_scam"
    assert res3["distinct_reporters_24h"] == 3


@pytest.mark.asyncio
async def test_impersonation_denied_triggers_potential_scam(async_db: AsyncSession):
    u = User(id="u_imp", phone_e164="+919888877771", display_name="User Imp")
    async_db.add(u)
    await async_db.commit()

    target_number = "+919988776655"

    # Single impersonation_denied immediately sets potential_scam
    await add_radar_report(async_db, target_number, u.id, "impersonation_denied")

    res = await lookup_number_radar(async_db, target_number)
    assert res["level"] == "potential_scam"
