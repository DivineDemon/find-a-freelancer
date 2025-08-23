import enum

from passlib.context import CryptContext
from sqlalchemy import Boolean, Column, Enum, String
from sqlalchemy.orm import relationship

from app.core.base import BaseModel

# Password hashing context - using bcrypt with proper configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Explicitly set rounds for better security
)


class UserType(str, enum.Enum):
    """Enum for user types."""
    CLIENT_HUNTER = "client_hunter"
    FREELANCER = "freelancer"


class User(BaseModel):
    """Base user model for both Client Hunters and Freelancers."""
    __tablename__ = "users"
    
    # Basic user information
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    
    # User type and status
    user_type = Column(Enum(UserType), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    chats_as_initiator = relationship(
        "Chat", 
        foreign_keys="Chat.initiator_id", 
        back_populates="initiator"
    )
    chats_as_participant = relationship(
        "Chat", 
        foreign_keys="Chat.participant_id", 
        back_populates="participant"
    )
    messages = relationship("Message", back_populates="sender")
    notifications = relationship("Notification", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, type={self.user_type})>"
    
    def set_password(self, password: str):
        """Hash and set the user's password."""
        self.password_hash = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify the user's password."""
        return pwd_context.verify(password, str(self.password_hash))
    
    @property
    def full_name(self) -> str:
        """Get the user's full name."""
        return f"{self.first_name} {self.last_name}"
