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
    image_url: Optional[str] = None


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


class LoginUserResponse(BaseModel):
    """Schema for login user response."""
    email: str
    first_name: str
    last_name: str
    image_url: Optional[str] = None
    account_status: str
    user_type: str
    payment_status: Optional[str] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Schema for login response."""
    access_token: str
    user: LoginUserResponse


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


class ProjectSummary(BaseModel):
    """Summary of a project for user profile."""
    id: int
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    cover_image: Optional[str] = None
    earned: float
    time_taken: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FreelancerProfileSummary(BaseModel):
    """Summary of freelancer profile for user response."""
    id: int
    title: str
    bio: Optional[str] = None
    hourly_rate: float
    years_of_experience: int
    skills: List[str]
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    is_available: bool
    country: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientHunterProfileSummary(BaseModel):
    """Summary of client hunter profile for user response."""
    id: int
    first_name: str
    last_name: str
    country: str
    is_paid: bool
    payment_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithProfiles(UserRead):
    """Schema for user with profile information."""
    freelancer_profile: Optional[FreelancerProfileSummary] = None
    client_hunter_profile: Optional[ClientHunterProfileSummary] = None


class ComprehensiveUserResponse(UserRead):
    """Comprehensive user response including all related data."""
    freelancer_profile: Optional[FreelancerProfileSummary] = None
    client_hunter_profile: Optional[ClientHunterProfileSummary] = None
    projects: Optional[List[ProjectSummary]] = None
