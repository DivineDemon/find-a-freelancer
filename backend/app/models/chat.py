
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel


class Chat(BaseModel):
    """Chat model for conversations between Client Hunters and Freelancers."""
    __tablename__ = "chats"

    # Chat participants
    initiator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)

    # Chat metadata
    # Auto-generated or user-defined title
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_archived: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)

    # Project context (optional)
    project_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    project_description: Mapped[Optional[str]
                                ] = mapped_column(Text, nullable=True)
    project_budget: Mapped[Optional[str]
                           ] = mapped_column(String, nullable=True)

    # Chat status
    # "active", "archived", "deleted"
    status: Mapped[str] = mapped_column(
        String, default="active", nullable=False)
    last_message_at: Mapped[Optional[DateTime]
                            ] = mapped_column(DateTime, nullable=True)

    # Relationships
    initiator = relationship(
        "User",
        foreign_keys=[initiator_id],
        back_populates="chats_as_initiator"
    )
    participant = relationship(
        "User",
        foreign_keys=[participant_id],
        back_populates="chats_as_participant"
    )
    messages = relationship(
        "Message",
        back_populates="chat",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Chat(id={self.id}, "
            f"initiator={self.initiator_id}, "
            f"participant={self.participant_id})>"
        )
