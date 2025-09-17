from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.jwt import create_access_token, verify_access_token
from app.core.logger import get_logger
from app.models.user import User
from app.schemas.user_schema import (
    PasswordChange,
    UserRead,
    UserUpdate,
    UserWithToken,
)

router = APIRouter(prefix="/user", tags=["User Management"])
security = HTTPBearer()
logger = get_logger(__name__)

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    token = credentials.credentials
    payload = verify_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_raw)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    return user

@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return UserRead.model_validate(current_user)

@router.put("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    for field, value in user_update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    await session.commit()
    await session.refresh(current_user)
    
    return UserRead.model_validate(current_user)

@router.post("/refresh", response_model=UserWithToken)
async def refresh_access_token(
    current_user: Annotated[User, Depends(get_current_user)]
):
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=settings.JWT_EXPIRATION_MINUTES
    )
    
    return UserWithToken(
        user=UserRead.model_validate(current_user),
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/change-password", response_model=dict)
async def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    if not current_user.verify_password(password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )

    current_user.set_password(password_data.new_password)
    await session.commit()

    return {"message": "Password changed successfully"}
