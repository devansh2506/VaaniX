import asyncio
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from sqlalchemy import func, select, and_, or_, not_, exists
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.models import RadarReport, Feedback, Call, User

# In-memory TTL cache: {number_e164: (timestamp, data)}
_radar_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 60.0


def normalize_e164(number: str) -> str:
    cleaned = "".join([c for c in number if c.isdigit() or c == "+"])
    if not cleaned.startswith("+"):
        if len(cleaned) == 10:
            cleaned = "+91" + cleaned
        elif len(cleaned) == 12 and cleaned.startswith("91"):
            cleaned = "+" + cleaned
        elif cleaned:
            cleaned = "+" + cleaned
    return cleaned


async def add_radar_report(
    db: AsyncSession,
    number_e164: str,
    reporter_user_id: str,
    source: str,  # 'ai_flag' | 'user_report' | 'impersonation_denied'
    call_id: Optional[str] = None,
    scam_type: Optional[str] = None,
) -> Optional[RadarReport]:
    norm_num = normalize_e164(number_e164)

    # Check that reporter is not reporting their own registered number
    user_res = await db.execute(select(User.phone_e164).where(User.id == reporter_user_id))
    user_phone = user_res.scalar_one_or_none()
    if user_phone and normalize_e164(user_phone) == norm_num:
        print(f"[radar] rejected report: user {reporter_user_id} cannot report own number {norm_num}")
        return None

    # Check if this user already reported this number recently (deduplication)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.RADAR_WINDOW_HOURS)
    existing_res = await db.execute(
        select(RadarReport.id).where(
            and_(
                RadarReport.number_e164 == norm_num,
                RadarReport.reporter_user_id == reporter_user_id,
                RadarReport.created_at >= cutoff,
            )
        )
    )
    if existing_res.first():
        # Already reported in window, update scam_type/call_id if newer, or skip
        return None

    report = RadarReport(
        number_e164=norm_num,
        reporter_user_id=reporter_user_id,
        source=source,
        call_id=call_id,
        scam_type=scam_type,
    )
    db.add(report)
    await db.commit()

    # Invalidate cache for this number
    _radar_cache.pop(norm_num, None)
    return report


async def lookup_number_radar(
    db: AsyncSession,
    number: str,
) -> Dict[str, Any]:
    norm_num = normalize_e164(number)
    now = time.time()

    # Check in-memory TTL cache
    cached = _radar_cache.get(norm_num)
    if cached and (now - cached[0]) < CACHE_TTL_SECONDS:
        return cached[1]

    utc_now = datetime.now(timezone.utc)
    t_24h = utc_now - timedelta(hours=24)
    t_7d = utc_now - timedelta(days=7)

    # Exclude reports where the call was marked as genuine feedback
    # Subquery: calls with genuine feedback
    genuine_call_ids_subq = select(Feedback.call_id).where(Feedback.label == "genuine")
    not_genuine_cond = or_(
        RadarReport.call_id.is_(None),
        not_(RadarReport.call_id.in_(genuine_call_ids_subq)),
    )

    # Distinct reporters in 24h
    q_24h = select(func.count(func.distinct(RadarReport.reporter_user_id))).where(
        and_(
            RadarReport.number_e164 == norm_num,
            RadarReport.created_at >= t_24h,
            not_genuine_cond,
        )
    )
    distinct_24h = (await db.execute(q_24h)).scalar() or 0

    # Distinct reporters in 7d
    q_7d = select(func.count(func.distinct(RadarReport.reporter_user_id))).where(
        and_(
            RadarReport.number_e164 == norm_num,
            RadarReport.created_at >= t_7d,
            not_genuine_cond,
        )
    )
    distinct_7d = (await db.execute(q_7d)).scalar() or 0

    # Check for any impersonation_denied in 24h
    q_denied = select(RadarReport.id).where(
        and_(
            RadarReport.number_e164 == norm_num,
            RadarReport.source == "impersonation_denied",
            RadarReport.created_at >= t_24h,
        )
    )
    has_impersonation_denied = (await db.execute(q_denied)).first() is not None

    # Determine radar risk level
    if distinct_24h >= settings.RADAR_THRESHOLD or has_impersonation_denied:
        level = "potential_scam"
    elif distinct_24h >= 1 or distinct_7d >= 1:
        level = "caution"
    else:
        level = "none"

    # Top scam type and last reported timestamp
    q_meta = (
        select(RadarReport.scam_type, RadarReport.created_at, RadarReport.call_id)
        .where(
            and_(
                RadarReport.number_e164 == norm_num,
                RadarReport.created_at >= t_7d,
                not_genuine_cond,
            )
        )
        .order_by(RadarReport.created_at.desc())
        .limit(5)
    )
    meta_rows = (await db.execute(q_meta)).all()

    top_scam_type = meta_rows[0][0] if meta_rows and meta_rows[0][0] else "family_emergency"
    last_reported_at = meta_rows[0][1].isoformat() if meta_rows else None

    # Top claim text from recent linked calls
    top_claim = "Someone claiming to be your family member"
    if meta_rows and meta_rows[0][2]:
        call_res = await db.execute(select(Call.claimed_identity_text).where(Call.id == meta_rows[0][2]))
        claim_val = call_res.scalar_one_or_none()
        if claim_val:
            top_claim = f"Caller claimed to be {claim_val}"

    response_data = {
        "number": norm_num,
        "level": level,
        "distinct_reporters_24h": distinct_24h,
        "distinct_reporters_7d": distinct_7d,
        "top_scam_type": top_scam_type,
        "top_claim": top_claim,
        "last_reported_at": last_reported_at,
    }

    # Cache response
    _radar_cache[norm_num] = (now, response_data)
    return response_data
