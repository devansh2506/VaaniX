from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import FamilyGroup, GroupMember, User
from app.db.session import get_db
from app.routers.auth import get_current_user
from app.services.telegram_bot import get_member_invite_url

router = APIRouter(prefix="/v1/groups", tags=["Family Groups"])


class CreateGroupRequest(BaseModel):
    name: Optional[str] = "My Family"


class AddMemberRequest(BaseModel):
    name: str
    aliases: Optional[List[str]] = []
    relationship: str  # son, daughter, husband, wife, father, mother, etc.
    phone: str


class UpdateMemberRequest(BaseModel):
    name: Optional[str] = None
    aliases: Optional[List[str]] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None


@router.post("")
async def create_group(
    req: CreateGroupRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(FamilyGroup).where(FamilyGroup.owner_user_id == user.id)
    )
    group = res.scalars().first()
    if group:
        if req.name:
            group.name = req.name
            await db.commit()
            await db.refresh(group)
    else:
        group = FamilyGroup(
            owner_user_id=user.id,
            name=req.name or "My Family",
        )
        db.add(group)
        await db.commit()
        await db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "invite_token": group.invite_token,
        "created_at": group.created_at.isoformat(),
    }


@router.get("/mine")
async def get_my_group(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(FamilyGroup).where(FamilyGroup.owner_user_id == user.id)
    )
    group = res.scalars().first()
    if not group:
        # Auto-create initial group for the user if none exists
        group = FamilyGroup(owner_user_id=user.id, name="My Family")
        db.add(group)
        await db.commit()
        await db.refresh(group)

    mem_res = await db.execute(
        select(GroupMember).where(GroupMember.group_id == group.id).order_by(GroupMember.name.asc())
    )
    members = mem_res.scalars().all()

    member_list = []
    for m in members:
        member_list.append({
            "id": m.id,
            "name": m.name,
            "aliases": m.aliases or [],
            "relationship": m.relationship_type,
            "phone": m.phone_e164,
            "telegram_joined": m.telegram_chat_id is not None,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            "invite_link": get_member_invite_url(m.member_join_token),
        })

    return {
        "id": group.id,
        "name": group.name,
        "invite_token": group.invite_token,
        "members": member_list,
    }


@router.post("/{group_id}/members")
async def add_group_member(
    group_id: str,
    req: AddMemberRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(FamilyGroup, group_id)
    if not group or group.owner_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "GROUP_NOT_FOUND", "message": "Group not found or unauthorized"}},
        )

    norm_phone = "".join([c for c in req.phone if c.isdigit() or c == "+"])
    if not norm_phone.startswith("+"):
        norm_phone = "+91" + norm_phone

    member = GroupMember(
        group_id=group.id,
        name=req.name.strip(),
        aliases=[a.strip() for a in req.aliases if a.strip()] if req.aliases else [],
        relationship_type=req.relationship.lower().strip(),
        phone_e164=norm_phone,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return {
        "id": member.id,
        "name": member.name,
        "aliases": member.aliases,
        "relationship": member.relationship_type,
        "phone": member.phone_e164,
        "invite_link": get_member_invite_url(member.member_join_token),
        "telegram_joined": False,
    }


@router.patch("/{group_id}/members/{member_id}")
async def update_group_member(
    group_id: str,
    member_id: str,
    req: UpdateMemberRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(GroupMember, member_id)
    if not member or member.group_id != group_id:
        raise HTTPException(status_code=404, detail="Member not found")

    if req.name is not None:
        member.name = req.name.strip()
    if req.aliases is not None:
        member.aliases = req.aliases
    if req.relationship is not None:
        member.relationship_type = req.relationship.lower().strip()
    if req.phone is not None:
        member.phone_e164 = req.phone

    await db.commit()
    return {"ok": True}


@router.delete("/{group_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group_member(
    group_id: str,
    member_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(GroupMember, member_id)
    if member and member.group_id == group_id:
        await db.delete(member)
        await db.commit()
    return None
