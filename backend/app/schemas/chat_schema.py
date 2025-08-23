from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user_schema import UserRead


class ChatBase(BaseModel):
    """Base chat schema."""
    title: Optional[str] = None
    project_title: Optional[str] = None
    project_description: Optional[str] = None
    project_budget: Optional[str] = None


class ChatCreate(ChatBase):
    """Schema for creating a new chat."""
    participant_id: int


class ChatUpdate(BaseModel):
    """Schema for updating chat information."""
    title: Optional[str] = None
    project_title: Optional[str] = None
    project_description: Optional[str] = None
    project_budget: Optional[str] = None
    is_archived: Optional[bool] = None


class ChatRead(ChatBase):
    """Schema for reading chat information."""
    id: int
    initiator_id: int
    participant_id: int
    is_archived: bool
    is_deleted: bool
    status: str
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatWithParticipants(ChatRead):
    """Schema for chat with participant information."""
    initiator: UserRead
    participant: UserRead


class ChatList(BaseModel):
    """Schema for list of chats."""
    chats: List[ChatWithParticipants]
    total: int
    limit: int
    offset: int
