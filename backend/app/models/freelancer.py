from sqlalchemy import JSON, Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base import BaseModel


class Freelancer(BaseModel):
    """Freelancer profile model with skills, rates, and experience."""
    __tablename__ = "freelancers"

    # Link to base user
    user_id = Column(Integer, ForeignKey("users.id"),
                     nullable=False, unique=True)

    # Professional information
    # e.g., "Senior Full-Stack Developer"
    title = Column(String, nullable=False)
    bio = Column(Text, nullable=True)  # Professional summary
    hourly_rate = Column(Float, nullable=False)  # Hourly rate in USD
    daily_rate = Column(Float, nullable=True)  # Daily rate in USD

    # Experience and skills
    years_of_experience = Column(Integer, nullable=False, default=0)
    # List of skill strings
    skills = Column(JSON, nullable=False, default=list)
    # List of tech strings
    technologies = Column(JSON, nullable=False, default=list)

    # Portfolio and work
    portfolio_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)

    # Availability and preferences
    is_available = Column(Boolean, default=True, nullable=False)
    # ["remote", "onsite", "hybrid"]
    preferred_work_type = Column(JSON, nullable=True, default=list)
    timezone = Column(String, nullable=True)  # e.g., "UTC-5"

    # Verification and trust
    is_verified = Column(Boolean, default=False, nullable=False)
    rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="freelancer_profile")

    def __repr__(self):
        return f"<Freelancer(id={self.id}, user_id={self.user_id}, title={self.title})>"
