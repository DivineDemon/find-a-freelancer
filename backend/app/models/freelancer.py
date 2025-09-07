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

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True)
    hourly_rate: Mapped[float] = mapped_column(
        Float, nullable=False)
    years_of_experience: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0)

    skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    is_available: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)

    country: Mapped[str] = mapped_column(String, nullable=False)

    user: Mapped["User"] = relationship(
        "User", back_populates="freelancer_profile")
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="freelancer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Freelancer(id={self.id}, user_id={self.user_id}, title={self.title})>"
