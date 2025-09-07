from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.user import User


class Message(BaseModel):
    """Message model for chat conversations."""
    __tablename__ = "messages"

    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(
        String, default="text", nullable=False)

    chat_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chats.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)

    chat: Mapped["Chat"] = relationship("Chat", back_populates="messages")
    sender: Mapped["User"] = relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, chat_id={self.chat_id}, " \
            f"sender_id={self.sender_id})>"
