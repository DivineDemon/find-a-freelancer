from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base import BaseModel


class Message(BaseModel):
    """Message model for chat conversations with content filtering."""
    __tablename__ = "messages"

    # Message content
    content = Column(Text, nullable=False)
    # "text", "image", "file"
    content_type = Column(String, default="text", nullable=False)

    # Message metadata
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Content moderation
    is_flagged = Column(Boolean, default=False, nullable=False)
    flag_reason = Column(String, nullable=True)  # Reason for flagging
    is_edited = Column(Boolean, default=False, nullable=False)
    # Store original content if edited
    original_content = Column(Text, nullable=True)

    # Message status
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Timestamps for message operations
    edited_at = Column(DateTime, nullable=True)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, chat_id={self.chat_id}, " \
            f"sender_id={self.sender_id})>"

    def edit_message(self, new_content: str):
        """Edit a message and store the original content."""
        if self.is_edited is False:
            self.original_content = self.content
        self.content = new_content
        self.is_edited = True
        self.edited_at = datetime.now(timezone.utc).replace(tzinfo=None)

    def delete_message(self):
        """Soft delete a message."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
