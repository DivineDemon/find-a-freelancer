"""User management router for admin operations and user listing."""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models.user import User, UserType
from app.routers.auth_router import get_current_user
from app.schemas.user_schema import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["User Management"])


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Get current user and verify they have admin privileges."""
    # For now, we'll consider verified users as admins
    # In a real app, you might have a separate admin role
    if current_user.is_verified is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


@router.get("/", response_model=List[UserRead])
async def list_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    user_type: UserType | None = Query(
        None, description="Filter by user type"
    ),
    is_active: bool | None = Query(
        None, description="Filter by active status"
    ),
    is_verified: bool | None = Query(
        None, description="Filter by verification status"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=100, 
        description="Maximum number of records to return"
    ),
):
    """List users with optional filtering and pagination."""
    query = select(User)
    
    # Apply filters
    if user_type:
        query = query.where(User.user_type == user_type)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if is_verified is not None:
        query = query.where(User.is_verified == is_verified)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await session.execute(query)
    users = result.scalars().all()
    
    return [UserRead.from_orm(user) for user in users]


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get a specific user by ID."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserRead.from_orm(user)


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Update a user (admin only)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        if field == "new_password" and value:
            user.set_password(value)
        elif field != "current_password" and field != "new_password":
            setattr(user, field, value)
    
    await session.commit()
    await session.refresh(user)
    
    return UserRead.from_orm(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Delete a user (admin only)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete - mark as inactive
    user.is_active = False  # type: ignore
    await session.commit()


@router.post("/{user_id}/verify", response_model=UserRead)
async def verify_user(
    user_id: int,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Verify a user account (admin only)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True  # type: ignore
    await session.commit()
    await session.refresh(user)
    
    return UserRead.from_orm(user)


@router.get("/stats/summary")
async def get_user_stats(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get user statistics summary (admin only)."""
    # Count total users
    total_result = await session.execute(select(User))
    total_users = len(total_result.scalars().all())
    
    # Count by user type
    client_hunters_result = await session.execute(
        select(User).where(User.user_type == UserType.CLIENT_HUNTER)
    )
    client_hunters_count = len(client_hunters_result.scalars().all())
    
    freelancers_result = await session.execute(
        select(User).where(User.user_type == UserType.FREELANCER)
    )
    freelancers_count = len(freelancers_result.scalars().all())
    
    # Count active and verified users
    active_result = await session.execute(
        select(User).where(User.is_active.is_(True))
    )
    active_users = len(active_result.scalars().all())
    
    verified_result = await session.execute(
        select(User).where(User.is_verified.is_(True))
    )
    verified_users = len(verified_result.scalars().all())
    
    return {
        "total_users": total_users,
        "client_hunters": client_hunters_count,
        "freelancers": freelancers_count,
        "active_users": active_users,
        "verified_users": verified_users,
        "verification_rate": (
            round((verified_users / total_users * 100), 2) 
            if total_users > 0 else 0
        )
    }
