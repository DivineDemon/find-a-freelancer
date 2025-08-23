from typing import Optional
from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel


class Freelancer(BaseModel):
    """Freelancer profile model with skills, rates, and experience."""
    __tablename__ = "freelancers"

    # Link to base user
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True)

    # Professional information
    # e.g., "Senior Full-Stack Developer"
    title: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True)  # Professional summary
    hourly_rate: Mapped[float] = mapped_column(
        Float, nullable=False)  # Hourly rate in USD
    daily_rate: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True)  # Daily rate in USD

    # Experience and skills
    years_of_experience: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0)
    # List of skill strings
    skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # List of tech strings
    technologies: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list)

    # Portfolio and work
    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Availability and preferences
    is_available: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)
    # ["remote", "onsite", "hybrid"]
    preferred_work_type: Mapped[Optional[list]] = mapped_column(
        JSON, nullable=True, default=list)
    timezone: Mapped[Optional[str]] = mapped_column(
        String, nullable=True)  # e.g., "UTC-5"

    # Verification and trust
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_reviews: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0)

    # Relationships
    user = relationship("User", back_populates="freelancer_profile")

    def __repr__(self):
        return f"<Freelancer(id={self.id}, user_id={self.user_id}, title={self.title})>"
