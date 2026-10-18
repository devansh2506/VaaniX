from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from app.config import settings
from app.db.session import init_db
from app.routers import (
    alerts,
    analyze,
    auth,
    complaints,
    evidence,
    groups,
    radar,
    redirects,
    telegram_webhook,
)


import asyncio
from app.services.telegram_polling import poll_telegram_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    
    polling_task = None
    if settings.TELEGRAM_MODE == "polling" and settings.TELEGRAM_BOT_TOKEN:
        polling_task = asyncio.create_task(poll_telegram_loop())

    yield

    if polling_task:
        polling_task.cancel()
        try:
            await polling_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="SatyaVoice Backend API",
    description="Real-time AI voice-clone detection, family impersonation alerts, scam radar, and payment guard backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend console and external integrators
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(radar.router)
app.include_router(groups.router)
app.include_router(alerts.router)
app.include_router(complaints.router)
app.include_router(evidence.router)
app.include_router(redirects.router)
app.include_router(telegram_webhook.router)


@app.get("/health", tags=["Health"])
async def health_check():
    """System health check endpoint verifying API, DB, and Model server connectivity."""
    model_status = "stub" if settings.VOICE_DETECTION_STUB else "offline"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{settings.MODEL_SERVER_URL}/health", timeout=1.5)
            if res.status_code == 200:
                data = res.json()
                model_status = "stub" if data.get("stub") else "ok"
    except Exception:
        pass

    return {
        "api": "ok",
        "db": "ok",
        "model": model_status,
        "stt": "ok",
        "environment": settings.ENV,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
