
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.logger import get_logger
from app.models.client_hunter import ClientHunter
from app.models.user import User
from app.schemas.generic import UserJWT
from app.schemas.user_schema import (
    ClientHunterProfileSummary,
    ComprehensiveUserResponse,
    UserRead,
    UserUpdate,
)
from app.utils.auth_utils import get_current_user

logger = get_logger(__name__)
router = APIRouter(prefix="/client_hunter", tags=["Client Hunter Management"])

class ClientHunterStatsResponse(BaseModel):
    total_client_hunters: int
    active_client_hunters: int
    paid_client_hunters: int

class StatusToggleResponse(BaseModel):
    message: str
    is_active: bool

@router.get("/{client_hunter_id}", response_model=ComprehensiveUserResponse)
async def get_client_hunter(
    client_hunter_id: int,
    session: AsyncSession = Depends(get_db)
):
    result = await session.execute(
        select(User)
        .options(selectinload(User.client_hunter_profile))
        .where(
            User.id == client_hunter_id, 
            User.user_type == "client_hunter"
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Client hunter not found")

    response_data = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "profile_picture": user.profile_picture,
        "user_type": user.user_type,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

    if user.client_hunter_profile:
        client_hunter = user.client_hunter_profile
        response_data["client_hunter_profile"] = ClientHunterProfileSummary(
            id=client_hunter.id,
            first_name=client_hunter.first_name,
            last_name=client_hunter.last_name,
            country=client_hunter.country,
            is_paid=client_hunter.is_paid,
            payment_date=client_hunter.payment_date,
            created_at=client_hunter.created_at,
            updated_at=client_hunter.updated_at
        )

    return response_data

@router.put("/{client_hunter_id}", response_model=UserRead)
async def update_client_hunter(
    client_hunter_id: int,
    user_update: UserUpdate,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    if int(current_user.sub) != client_hunter_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )

    result = await session.execute(
        select(User).where(User.id == client_hunter_id, 
            User.user_type == "client_hunter")
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Client hunter not found")

    for field, value in user_update.model_dump(exclude_unset=True).items():
        if hasattr(user, field):
            setattr(user, field, value)

    await session.commit()
    await session.refresh(user)

    return UserRead.model_validate(user)

@router.patch("/toggle_status/{client_hunter_id}", response_model=StatusToggleResponse)
async def toggle_client_hunter_status(
    client_hunter_id: int,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    if int(current_user.sub) != client_hunter_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )

    result = await session.execute(
        select(User).where(User.id == client_hunter_id, 
            User.user_type == "client_hunter")
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Client hunter not found")

    user.is_active = not user.is_active
    await session.commit()

    status_text = "activated" if user.is_active else "deactivated"
    return StatusToggleResponse(
        message=f"Client hunter status {status_text}",
        is_active=user.is_active
    )

@router.get("/stats/summary", response_model=ClientHunterStatsResponse)
async def get_client_hunter_stats(session: AsyncSession = Depends(get_db)):
    try:
        total_client_hunters = await session.scalar(
            select(func.count(User.id)).where(
                User.user_type == "client_hunter"
            )
        )

        active_client_hunters = await session.scalar(
            select(func.count(User.id)).where(
                User.user_type == "client_hunter",
                User.is_active
            )
        )

        paid_client_hunters = await session.scalar(
            select(func.count(ClientHunter.id)).where(ClientHunter.is_paid)
        )

        return {
            "total_client_hunters": total_client_hunters or 0,
            "active_client_hunters": active_client_hunters or 0,
            "paid_client_hunters": paid_client_hunters or 0
        }

    except Exception as e:
        logger.error(f"Error getting client hunter stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
