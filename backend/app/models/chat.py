from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.message import Message
    from app.models.user import User

class Chat(BaseModel):
    __tablename__ = "chats"

    initiator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)

    is_archived_by_initiator: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    is_archived_by_participant: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)

    project_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    project_description: Mapped[Optional[str]
                                ] = mapped_column(Text, nullable=True)
    project_budget: Mapped[Optional[str]
                           ] = mapped_column(String, nullable=True)

    last_message_at: Mapped[Optional[DateTime]
                            ] = mapped_column(DateTime, nullable=True)

    initiator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[initiator_id],
        back_populates="chats_as_initiator"
    )
    participant: Mapped["User"] = relationship(
        "User",
        foreign_keys=[participant_id],
        back_populates="chats_as_participant"
    )
    messages: Mapped[list["Message"]] = relationship(
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
