from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User
from app.db.session import get_db
from app.routers.auth import get_current_user
from app.services.radar import add_radar_report, lookup_number_radar

router = APIRouter(prefix="/v1/radar", tags=["Scam Radar"])


class RadarReportRequest(BaseModel):
    number: str
    reason: Optional[str] = "user_report"
    call_id: Optional[str] = None
    scam_type: Optional[str] = None


@router.get("/lookup")
async def radar_lookup(
    number: str = Query(..., description="Phone number to lookup in E.164 format"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fast caller number reputation lookup for ringing call screen.
    Designed to respond in < 300ms using indexed DB and in-memory TTL cache.
    """
    if not number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "MISSING_NUMBER", "message": "Phone number is required"}},
        )

    result = await lookup_number_radar(db, number)
    return result


@router.post("/report", status_code=status.HTTP_204_NO_CONTENT)
async def radar_report(
    req: RadarReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits a user or system flag for a phone number."""
    if not req.number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "MISSING_NUMBER", "message": "Phone number is required"}},
        )

    await add_radar_report(
        db=db,
        number_e164=req.number,
        reporter_user_id=user.id,
        source=req.reason or "user_report",
        call_id=req.call_id,
        scam_type=req.scam_type,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
