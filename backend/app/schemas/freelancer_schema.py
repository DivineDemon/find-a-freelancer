from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class ProjectBase(BaseModel):
    
    title: str
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    cover_image: Optional[str] = None
    earned: float
    time_taken: Optional[str] = None

class ProjectCreate(ProjectBase):
    
    pass

class ProjectUpdate(BaseModel):
    
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    cover_image: Optional[str] = None
    earned: Optional[float] = None
    time_taken: Optional[str] = None

class ProjectRead(ProjectBase):
    
    id: int
    freelancer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectDeleteResponse(BaseModel):
    message: str

class FreelancerBase(BaseModel):
    
    title: str
    bio: Optional[str] = None
    hourly_rate: float
    years_of_experience: int
    skills: List[str]
    portfolio_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    is_available: bool
    country: str

class FreelancerCreate(FreelancerBase):
    
    pass

class FreelancerUpdate(BaseModel):
    
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    years_of_experience: Optional[int] = None
    skills: Optional[List[str]] = None
    portfolio_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    is_available: Optional[bool] = None
    country: Optional[str] = None


class FreelancerCompleteUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: Optional[bool] = None

    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    years_of_experience: Optional[int] = None
    skills: Optional[List[str]] = None
    portfolio_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    is_available: Optional[bool] = None
    country: Optional[str] = None

class FreelancerRead(FreelancerBase):
    
    id: int
    user_id: int
    projects: List[ProjectRead]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FreelancerWithUser(FreelancerRead):

    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    user_type: str
    is_active: bool
    user_created_at: datetime
    user_updated_at: datetime

    class Config:
        from_attributes = True

class DashboardFreelancerResponse(BaseModel):
    
    freelancer_image: Optional[str] = None
    freelancer_position: str
    freelancer_rate: float
    freelancer_experience: int
    skills: List[str]
    user_id: int
    freelancer_id: int
    freelancer_first_name: str
    freelancer_last_name: str

    class Config:
        from_attributes = True

class FreelancerSearch(BaseModel):
    
    skills: Optional[List[str]] = None
    min_rate: Optional[float] = None
    max_rate: Optional[float] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    work_type: Optional[str] = None
    is_available: Optional[bool] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
