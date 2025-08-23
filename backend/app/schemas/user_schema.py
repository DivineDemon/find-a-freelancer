from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserType


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    profile_picture: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)
    user_type: UserType


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    profile_picture: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=100)


class UserRead(UserBase):
    """Schema for reading user information."""
    id: int
    user_type: UserType
    is_active: bool
    is_verified: bool
    
    class Config:
        from_attributes = True


class UserWithToken(BaseModel):
    """Schema for user with authentication token."""
    user: UserRead
    access_token: str
    token_type: str
