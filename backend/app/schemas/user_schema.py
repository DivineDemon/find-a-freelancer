from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):

    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):

    password: str
    user_type: str
    image_url: Optional[str] = None
    country: Optional[str] = None

class UserLogin(BaseModel):

    email: EmailStr
    password: str

class UserUpdate(BaseModel):

    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):

    current_password: str
    new_password: str

class UserRead(UserBase):

    id: int
    profile_picture: Optional[str] = None
    user_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserWithToken(BaseModel):

    user: UserRead
    access_token: str
    token_type: str

class LoginUserResponse(BaseModel):

    user_id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    image_url: Optional[str] = None
    account_status: str
    user_type: str
    payment_status: Optional[str] = None

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):

    access_token: str
    user: LoginUserResponse

class UserStatsSummary(BaseModel):

    total_users: int
    client_hunters: int
    freelancers: int
    active_users: int

class ProjectSummary(BaseModel):

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

    freelancer_profile: Optional[FreelancerProfileSummary] = None
    client_hunter_profile: Optional[ClientHunterProfileSummary] = None

class ComprehensiveUserResponse(UserRead):

    freelancer_profile: Optional[FreelancerProfileSummary] = None
    client_hunter_profile: Optional[ClientHunterProfileSummary] = None
    projects: Optional[List[ProjectSummary]] = None

class ProfileCreationResponse(BaseModel):

    message: str
    user_type: str
