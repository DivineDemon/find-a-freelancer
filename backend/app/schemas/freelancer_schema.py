from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class FreelancerBase(BaseModel):
    """Base freelancer schema."""
    title: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = None
    hourly_rate: float = Field(..., gt=0)
    daily_rate: Optional[float] = Field(None, gt=0)
    years_of_experience: int = Field(..., ge=0)
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    portfolio_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    is_available: bool = True
    preferred_work_type: List[str] = Field(default_factory=list)
    timezone: Optional[str] = None


class FreelancerCreate(FreelancerBase):
    """Schema for creating a freelancer profile."""
    pass


class FreelancerUpdate(BaseModel):
    """Schema for updating freelancer profile."""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = None
    hourly_rate: Optional[float] = Field(None, gt=0)
    daily_rate: Optional[float] = Field(None, gt=0)
    years_of_experience: Optional[int] = Field(None, ge=0)
    skills: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    portfolio_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    is_available: Optional[bool] = None
    preferred_work_type: Optional[List[str]] = None
    timezone: Optional[str] = None


class FreelancerRead(FreelancerBase):
    """Schema for reading freelancer profile."""
    id: int
    user_id: int
    is_verified: bool
    rating: float
    total_reviews: int

    class Config:
        from_attributes = True


class FreelancerSearch(BaseModel):
    """Schema for freelancer search parameters."""
    skills: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    min_rate: Optional[float] = None
    max_rate: Optional[float] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    work_type: Optional[str] = None
    is_available: Optional[bool] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
