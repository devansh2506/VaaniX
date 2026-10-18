import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    phone_e164: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    state_code: Mapped[Optional[str]] = mapped_column(String(8), nullable=True, default="DL")
    bank_code: Mapped[Optional[str]] = mapped_column(String(16), nullable=True, default="SBI")
    telegram_chat_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    telegram_link_token: Mapped[str] = mapped_column(String(64), unique=True, default=generate_uuid, index=True)
    language: Mapped[str] = mapped_column(String(8), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    family_groups = relationship("FamilyGroup", back_populates="owner", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="user")
    alerts = relationship("Alert", back_populates="user")


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fcm_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    app_version: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="devices")


class FamilyGroup(Base):
    __tablename__ = "family_groups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    owner_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(128), default="My Family")
    invite_token: Mapped[str] = mapped_column(String(64), unique=True, default=generate_uuid, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    owner = relationship("User", back_populates="family_groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("family_groups.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    aliases: Mapped[list] = mapped_column(JSON, default=list)
    relationship_type: Mapped[str] = mapped_column(String(32), nullable=False)
    phone_e164: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    telegram_chat_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    member_join_token: Mapped[str] = mapped_column(String(64), unique=True, default=generate_uuid, index=True)
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    group = relationship("FamilyGroup", back_populates="members")


class Call(Base):
    __tablename__ = "calls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    caller_e164: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    direction: Mapped[str] = mapped_column(String(16), default="incoming")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    clip_start_s: Mapped[int] = mapped_column(Integer, default=5)
    clip_end_s: Mapped[int] = mapped_column(Integer, default=15)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    window_scores: Mapped[list] = mapped_column(JSON, default=list)
    verdict: Mapped[str] = mapped_column(String(32), default="REAL")
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transcript_lang: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    claimed_member_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("group_members.id"), nullable=True)
    claim_source: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    claimed_identity_text: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    scam_words: Mapped[list] = mapped_column(JSON, default=list)
    scam_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    audio_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    audio_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="calls")
    alert = relationship("Alert", back_populates="call", uselist=False)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    call_id: Mapped[str] = mapped_column(String(36), ForeignKey("calls.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open")
    impersonated_member_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("group_members.id"), nullable=True)
    impersonated_response: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="alerts")
    call = relationship("Call", back_populates="alert")
    messages = relationship("AlertMessage", back_populates="alert", cascade="all, delete-orphan")


class AlertMessage(Base):
    __tablename__ = "alert_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    alert_id: Mapped[str] = mapped_column(String(36), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    recipient_chat_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    telegram_message_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    alert = relationship("Alert", back_populates="messages")


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    alert_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    target: Mapped[str] = mapped_column(String(32), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class RadarReport(Base):
    __tablename__ = "radar_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    number_e164: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    reporter_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    call_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("calls.id"), nullable=True)
    scam_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


Index("idx_radar_reports_number_created", RadarReport.number_e164, RadarReport.created_at.desc())


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    call_id: Mapped[str] = mapped_column(String(36), ForeignKey("calls.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ApiClient(Base):
    __tablename__ = "api_clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    api_key_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    scopes: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
