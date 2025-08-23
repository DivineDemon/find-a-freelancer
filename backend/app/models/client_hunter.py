from sqlalchemy import JSON, Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.base import BaseModel


class ClientHunter(BaseModel):
    """Client Hunter profile model for users who outsource work."""
    __tablename__ = "client_hunters"

    # Link to base user
    user_id = Column(Integer, ForeignKey("users.id"),
                     nullable=False, unique=True)

    # Business information
    company_name = Column(String, nullable=True)
    # e.g., "Agency", "Startup", "Enterprise"
    business_type = Column(String, nullable=True)
    # e.g., "Technology", "Healthcare", "Finance"
    industry = Column(String, nullable=True)

    # Project preferences
    # ["web-app", "mobile-app", "ai-ml"]
    preferred_project_types = Column(JSON, nullable=True, default=list)
    # ["$1k-$5k", "$5k-$10k", "$10k+"]
    budget_range = Column(JSON, nullable=True, default=list)

    # Communication preferences
    # ["chat", "video-call", "email"]
    preferred_communication = Column(JSON, nullable=True, default=list)
    timezone = Column(String, nullable=True)  # e.g., "UTC-5"

    # Payment and verification
    has_paid_one_time_fee = Column(Boolean, default=False, nullable=False)
    payment_date = Column(String, nullable=True)  # Store payment confirmation

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
