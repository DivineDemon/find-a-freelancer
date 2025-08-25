from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class ClientHunter(BaseModel):
    """Client Hunter profile model for users who outsource work."""
    __tablename__ = "client_hunters"

    # Link to base user
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True)

    # Basic information
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)

    # Payment status
    is_paid: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    payment_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="client_hunter_profile",
        uselist=False
    )
    
    def __repr__(self):
        return (
            f"<ClientHunter(id={self.id}, "
            f"user_id={self.user_id}, "
            f"name={self.first_name} {self.last_name})>"
        )
