from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class Freelancer(BaseModel):
    """Freelancer profile model with skills, rates, and experience."""
    __tablename__ = "freelancers"

    # Link to base user
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True)

    # Professional information
    title: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True)  # Professional summary
    hourly_rate: Mapped[float] = mapped_column(
        Float, nullable=False)  # Hourly rate in USD
    years_of_experience: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0)

    # Skills and technologies
    skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    technologies: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list)

    # Portfolio and social links
    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Availability
    is_available: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)

    # Location
    country: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="freelancer_profile")
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="freelancer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Freelancer(id={self.id}, user_id={self.user_id}, title={self.title})>"
