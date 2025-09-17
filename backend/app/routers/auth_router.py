from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.jwt import create_access_token
from app.core.logger import get_logger
from app.models.client_hunter import ClientHunter
from app.models.freelancer import Freelancer
from app.models.user import User
from app.schemas.user_schema import (
    LoginResponse,
    LoginUserResponse,
    UserCreate,
    UserLogin,
    UserRead,
    UserWithToken,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)

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

        user_data_dict = user_data.model_dump(exclude={"password", "country"})
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
            user_id=user.id,
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
