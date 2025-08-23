"""Authentication router for user registration, login, and profile management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.core.jwt import create_access_token, verify_access_token
from app.models.user import User
from app.schemas.user_schema import (
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
    UserWithToken,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> User:
    """Get the current authenticated user from JWT token."""
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
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


@router.post(
    "/register", 
    response_model=UserWithToken, 
    status_code=status.HTTP_201_CREATED
)
async def register_user(
    user_data: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Register a new user."""
    # Check if user already exists
    result = await session.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_data_dict = user_data.dict(exclude={"password"})
    # Ensure profile_picture is None if empty string
    if user_data_dict.get("profile_picture") == "":
        user_data_dict["profile_picture"] = None

    user = User(**user_data_dict)
    user.set_password(user_data.password)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    # Generate access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=settings.JWT_EXPIRATION_MINUTES
    )
    
    return UserWithToken(
        user=UserRead.from_orm(user),
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/login", response_model=UserWithToken)
async def login_user(
    user_credentials: UserLogin,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Login user with email and password."""
    # Find user by email
    result = await session.execute(
        select(User).where(User.email == user_credentials.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.verify_password(user_credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Generate access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=settings.JWT_EXPIRATION_MINUTES
    )
    
    return UserWithToken(
        user=UserRead.from_orm(user),
        access_token=access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user's profile."""
    return UserRead.from_orm(current_user)


@router.put("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Update current user's profile."""
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    await session.commit()
    await session.refresh(current_user)
    
    return UserRead.from_orm(current_user)


@router.post("/refresh", response_model=UserWithToken)
async def refresh_access_token(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Refresh user's access token."""
    # Generate new access token
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=settings.JWT_EXPIRATION_MINUTES
    )
    
    return UserWithToken(
        user=UserRead.from_orm(current_user),
        access_token=access_token,
        token_type="bearer"
    )
