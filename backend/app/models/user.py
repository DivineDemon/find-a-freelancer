import enum
from typing import TYPE_CHECKING, Optional

from passlib.context import CryptContext
from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.client_hunter import ClientHunter
    from app.models.freelancer import Freelancer
    from app.models.message import Message

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

class UserType(str, enum.Enum):
    CLIENT_HUNTER = "client_hunter"
    FREELANCER = "freelancer"

class User(BaseModel):
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_picture: Mapped[Optional[str]
                            ] = mapped_column(String, nullable=True)
    
    user_type: Mapped[UserType] = mapped_column(Enum(UserType), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)

    chats_as_initiator: Mapped[list["Chat"]] = relationship(
        "Chat", 
        foreign_keys="Chat.initiator_id", 
        back_populates="initiator"
    )
    chats_as_participant: Mapped[list["Chat"]] = relationship(
        "Chat", 
        foreign_keys="Chat.participant_id", 
        back_populates="participant"
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="sender")
    
    client_hunter_profile: Mapped[Optional["ClientHunter"]] = relationship(
        "ClientHunter", back_populates="user", uselist=False)
    freelancer_profile: Mapped[Optional["Freelancer"]] = relationship(
        "Freelancer", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, type={self.user_type})>"
    
    def set_password(self, password: str):
        self.password_hash = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, str(self.password_hash))
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
