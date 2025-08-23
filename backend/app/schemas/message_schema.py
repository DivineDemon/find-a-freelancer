from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.user_schema import UserRead


class MessageBase(BaseModel):
    """Base message schema."""
    content: str = Field(..., min_length=1, max_length=2000)
    content_type: str = Field(default="text", pattern="^(text|image|file)$")


class MessageCreate(MessageBase):
    """Schema for creating a new message."""
    chat_id: int


class MessageUpdate(BaseModel):
    """Schema for updating message content."""
    content: str = Field(..., min_length=1, max_length=2000)


class MessageRead(MessageBase):
    """Schema for reading message information."""
    id: int
    chat_id: int
    sender_id: int
    is_flagged: bool
    flag_reason: Optional[str] = None
    is_edited: bool
    original_content: Optional[str] = None
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    edited_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageWithSender(MessageRead):
    """Schema for message with sender information."""
    sender: UserRead


class MessageList(BaseModel):
    """Schema for list of messages."""
    messages: List[MessageWithSender]
    total: int
    limit: int
    offset: int


class MessageFilter(BaseModel):
    """Schema for filtering messages."""
    chat_id: int
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)
    include_deleted: bool = False
