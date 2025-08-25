from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.user import User


class Message(BaseModel):
    """Message model for chat conversations with content filtering."""
    __tablename__ = "messages"

    # Message content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # "text", "image", "file"
    content_type: Mapped[str] = mapped_column(
        String, default="text", nullable=False)

    # Message metadata
    chat_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chats.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)

    # Content moderation
    is_flagged: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(
        String, nullable=True)  # Reason for flagging
    is_edited: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    # Store original content if edited
    original_content: Mapped[Optional[str]
                             ] = mapped_column(Text, nullable=True)

    # Message status
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)

    # Timestamps for message operations
    edited_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)

    # Relationships
    chat: Mapped["Chat"] = relationship("Chat", back_populates="messages")
    sender: Mapped["User"] = relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, chat_id={self.chat_id}, " \
            f"sender_id={self.sender_id})>"

    def edit_message(self, new_content: str):
        """Edit a message and store the original content."""
        if self.is_edited is False:
            self.original_content = self.content
        self.content = new_content
        self.is_edited = True
        self.edited_at = datetime.now(timezone.utc)

    def delete_message(self):
        """Soft delete a message."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
