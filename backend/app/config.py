import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    ENV: str = "dev"
    API_BASE_URL: str = "http://localhost:8000"

    # Default to local SQLite with aiosqlite for standalone execution without docker; easily switched to PostgreSQL
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./satyavoice.db",
        description="Database connection URL (PostgreSQL or SQLite)",
    )
    SYNC_DATABASE_URL: str = Field(
        default="sqlite:///./satyavoice.db",
        description="Sync database connection URL for migrations or scripts",
    )

    JWT_SECRET: str = "satyavoice-dev-jwt-secret-key-change-in-production-12345"
    REDIRECT_SECRET: str = "satyavoice-dev-redirect-secret-hmac-key-67890"

    MODEL_SERVER_URL: str = "http://127.0.0.1:8765"
    VOICE_DETECTION_STUB: bool = True
    FORCE_VERDICT: str | None = None  # "AI_CLONE" or "REAL"

    AI_THRESHOLD: int = 60
    REAL_THRESHOLD: int = 40
    RADAR_THRESHOLD: int = 3
    RADAR_WINDOW_HOURS: int = 24
    GUARD_MINUTES: int = 30

    STT_MODEL: str = "small"
    STT_DEVICE: str = "auto"

    AUDIO_DIR: str = str(BASE_DIR / "data" / "audio")
    AUDIO_RETENTION_DAYS: int = 30

    TELEGRAM_BOT_TOKEN: str = "8899838034:AAFGAB66I6aEVCOPuGuCjguYACLTexhDXas"
    TELEGRAM_BOT_USERNAME: str = "Prevent_Scambot"
    TELEGRAM_MODE: str = "polling"

    FCM_SERVER_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
