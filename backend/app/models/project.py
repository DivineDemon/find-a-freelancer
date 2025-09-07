from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.freelancer import Freelancer


class Project(BaseModel):
    """Project model for freelancers to showcase their work."""
    __tablename__ = "projects"

    freelancer_id: Mapped[int] = mapped_column(
        ForeignKey("freelancers.id"), nullable=False)

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    earned: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0)
    time_taken: Mapped[Optional[str]] = mapped_column(
        String, nullable=True)

    freelancer: Mapped["Freelancer"] = relationship(
        "Freelancer", back_populates="projects")

    def __repr__(self):
        return f"<Project(id={self.id}, title={self.title}, " \
               f"freelancer_id={self.freelancer_id})>"
