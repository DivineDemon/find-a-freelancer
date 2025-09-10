from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.jwt import create_access_token, verify_access_token
from app.core.logger import get_logger
from app.models.client_hunter import ClientHunter
from app.models.freelancer import Freelancer
from app.models.user import User
from app.schemas.user_schema import (
    LoginResponse,
    LoginUserResponse,
    PasswordChange,
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
    UserWithToken,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
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

@router.post(
    "/register", 
    response_model=UserWithToken, 
    status_code=status.HTTP_201_CREATED
)
async def register_user(
    user_data: UserCreate,
    session: Annotated[AsyncSession, Depends(get_db)]
):
    try:
        result = await session.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        user_data_dict = user_data.model_dump(exclude={"password"})
        if "image_url" in user_data_dict:
            user_data_dict["profile_picture"] = user_data_dict.pop(
                "image_url")
        if user_data_dict.get("profile_picture") == "":
            user_data_dict["profile_picture"] = None

        user = User(**user_data_dict)
        user.set_password(user_data.password)
        session.add(user)
        await session.commit()
        await session.refresh(user)

        if user.user_type == "client_hunter":
            client_hunter = ClientHunter(
                user_id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                country=user_data.country or "Unknown"
            )
            session.add(client_hunter)
        elif user.user_type == "freelancer":
            freelancer = Freelancer(
                user_id=user.id,
                title="Freelancer",
                bio="",
                hourly_rate=0.0,
                years_of_experience=0,
                skills=[],
                is_available=True,
                country=user_data.country or "Unknown"
            )
            session.add(freelancer)

        await session.commit()
        await session.refresh(user)

        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=settings.JWT_EXPIRATION_MINUTES
        )

        return UserWithToken(
            user=UserRead.model_validate(user),
            access_token=access_token,
            token_type="bearer"
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
async def login_user(
    user_credentials: UserLogin,
    session: Annotated[AsyncSession, Depends(get_db)]
):
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
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=settings.JWT_EXPIRATION_MINUTES
    )

    if user.user_type == "freelancer":
        payment_status = "paid"
    else:
        from app.models.client_hunter import ClientHunter
        client_hunter_result = await session.execute(
            select(ClientHunter).where(ClientHunter.user_id == user.id)
        )
        client_hunter = client_hunter_result.scalar_one_or_none()
        payment_status = "paid" if client_hunter and client_hunter.is_paid else "unpaid"

    return LoginResponse(
        access_token=access_token,
        user=LoginUserResponse(
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            image_url=user.profile_picture,
            account_status="active" if user.is_active else "inactive",
            user_type=user.user_type,
            payment_status=payment_status
        )
    )

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
