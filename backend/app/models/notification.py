import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.base import BaseModel


class NotificationType(str, enum.Enum):
    """Enum for notification types."""
    CHAT_MESSAGE = "chat_message"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PAYMENT_FAILED = "payment_failed"
    ACCOUNT_VERIFIED = "account_verified"
    SYSTEM_UPDATE = "system_update"


class Notification(BaseModel):
    """Notification model for user alerts and system messages."""
    __tablename__ = "notifications"
    
    # Notification details
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Notification metadata
    is_read = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # Related entities (optional)
    related_chat_id = Column(Integer, ForeignKey("chats.id"), nullable=True)
    related_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    
    # Timestamps
    read_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    related_chat = relationship("Chat")
    related_payment = relationship("Payment")
    
    def __repr__(self):
        return (
            f"<Notification(id={self.id}, "
            f"user_id={self.user_id}, "
            f"type={self.notification_type})>"
        )
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.read_at = datetime.now(timezone.utc).replace(tzinfo=None)
    
    def archive(self):
        """Archive notification."""
        self.is_archived = True
        self.archived_at = datetime.now(timezone.utc).replace(tzinfo=None)
