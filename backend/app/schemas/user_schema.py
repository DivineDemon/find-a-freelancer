from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str
    user_type: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: Optional[bool] = None


class UserRead(UserBase):
    """Schema for reading user information."""
    id: int
    profile_picture: Optional[str] = None
    user_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithToken(BaseModel):
    """Schema for user with authentication token."""
    user: UserRead
    access_token: str
    token_type: str


class UserStatsSummary(BaseModel):
    """Schema for user statistics summary."""
    total_users: int
    client_hunters: int
    freelancers: int
    active_users: int


class OnlineUsersResponse(BaseModel):
    """Schema for online users response."""
    online_users: List[int]
    total_online: int


class UserStatusResponse(BaseModel):
    """Schema for user status response."""
    user_id: int
    is_online: bool


class UserWithProfiles(UserRead):
    """Schema for user with profile information."""
    freelancer_profile: Optional[dict] = None
    client_hunter_profile: Optional[dict] = None
