import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.payment import Payment
    from app.models.user import User


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
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Notification metadata
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    
    # Related entities (optional)
    related_chat_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("chats.id"), nullable=True)
    related_payment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("payments.id"), nullable=True)
    
    # Timestamps
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)
    archived_at: Mapped[Optional[datetime]
                        ] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
    related_chat: Mapped[Optional["Chat"]] = relationship("Chat")
    related_payment: Mapped[Optional["Payment"]] = relationship("Payment")
    
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
