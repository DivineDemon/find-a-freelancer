
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base import BaseModel


class Chat(BaseModel):
    """Chat model for conversations between Client Hunters and Freelancers."""
    __tablename__ = "chats"

    # Chat participants
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Chat metadata
    # Auto-generated or user-defined title
    title = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Project context (optional)
    project_title = Column(String, nullable=True)
    project_description = Column(Text, nullable=True)
    project_budget = Column(String, nullable=True)

    # Chat status
    # "active", "archived", "deleted"
    status = Column(String, default="active", nullable=False)
    last_message_at = Column(DateTime, nullable=True)

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
