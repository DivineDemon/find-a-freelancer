"""Message-related Pydantic schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.user import UserType


class MessageBase(BaseModel):
    """Base message schema."""
    content: str = Field(
        ..., min_length=1, max_length=5000, description="Message content"
    )
    content_type: str = Field(
        "text", pattern="^(text|image|file)$", description="Message type"
    )


class MessageCreate(MessageBase):
    """Schema for creating a new message."""
    chat_id: int = Field(..., description="ID of the chat to send message to")


class MessageUpdate(BaseModel):
    """Schema for updating a message - messages cannot be edited."""
    pass


class MessageRead(MessageBase):
    """Schema for reading message information."""
    id: int
    chat_id: int
    sender_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageWithSender(MessageRead):
    """Schema for message with sender information."""
    sender_name: str
    sender_type: UserType
    sender_avatar: Optional[str]


class MessageList(BaseModel):
    """Schema for paginated message list."""
    messages: List[MessageWithSender]
    total: int
    page: int
    size: int
    has_next: bool
    has_prev: bool


class MessageFilter(BaseModel):
    """Schema for message filtering parameters."""
    chat_id: Optional[int] = Field(None, description="Filter by specific chat")
    sender_id: Optional[int] = Field(None, description="Filter by sender")
    content_type: Optional[str] = Field(None, pattern="^(text|image|file)$")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(50, ge=1, le=200, description="Page size")




class MessageReaction(BaseModel):
    """Schema for message reactions."""
    message_id: int
    reaction_type: str = Field(
        ..., pattern="^(like|love|laugh|wow|sad|angry)$"
    )
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MessageSearch(BaseModel):
    """Schema for message search parameters."""
    query: str = Field(..., min_length=1, max_length=100,
                       description="Search query")
    chat_id: Optional[int] = Field(
        None, description="Search within specific chat")
    sender_id: Optional[int] = Field(
        None, description="Search messages from specific user"
    )
    date_from: Optional[datetime] = Field(None, description="Search from date")
    date_to: Optional[datetime] = Field(None, description="Search to date")
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")
