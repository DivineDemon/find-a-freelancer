from typing import Optional
from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel


class ClientHunter(BaseModel):
    """Client Hunter profile model for users who outsource work."""
    __tablename__ = "client_hunters"

    # Link to base user
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True)

    # Business information
    company_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # e.g., "Agency", "Startup", "Enterprise"
    business_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # e.g., "Technology", "Healthcare", "Finance"
    industry: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Project preferences
    # ["web-app", "mobile-app", "ai-ml"]
    preferred_project_types: Mapped[Optional[list]] = mapped_column(
        JSON, nullable=True, default=list)
    # ["$1k-$5k", "$5k-$10k", "$10k+"]
    budget_range: Mapped[Optional[list]] = mapped_column(
        JSON, nullable=True, default=list)

    # Communication preferences
    # ["chat", "video-call", "email"]
    preferred_communication: Mapped[Optional[list]] = mapped_column(
        JSON, nullable=True, default=list)
    timezone: Mapped[Optional[str]] = mapped_column(
        String, nullable=True)  # e.g., "UTC-5"

    # Payment and verification
    has_paid_one_time_fee: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    payment_date: Mapped[Optional[str]] = mapped_column(
        String, nullable=True)  # Store payment confirmation

    # Relationships
    user = relationship(
        "User",
        back_populates="client_hunter_profile",
        uselist=False
    )
    
    def __repr__(self):
        return (
            f"<ClientHunter(id={self.id}, "
            f"user_id={self.user_id}, "
            f"company={self.company_name})>"
        )
