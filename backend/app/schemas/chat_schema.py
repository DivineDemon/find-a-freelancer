from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.user import UserType


class ChatBase(BaseModel):
    
    project_title: Optional[str] = Field(
        None, max_length=200, description="Project title"
    )
    project_description: Optional[str] = Field(
        None, max_length=1000, description="Project description"
    )
    project_budget: Optional[str] = Field(
        None, max_length=100, description="Project budget range"
    )

class ChatCreate(ChatBase):
    
    participant_id: int = Field(
        ..., description="ID of the user to start chat with"
    )
    project_title: Optional[str] = Field(
        None, max_length=200, description="Project title"
    )
    project_description: Optional[str] = Field(
        None, max_length=1000, description="Project description"
    )
    project_budget: Optional[str] = Field(
        None, max_length=100, description="Project budget range"
    )

class ChatUpdate(BaseModel):
    
    is_archived_by_initiator: Optional[bool] = None
    is_archived_by_participant: Optional[bool] = None

class ChatRead(ChatBase):
    
    id: int
    initiator_id: int
    participant_id: int
    is_archived_by_initiator: bool
    is_archived_by_participant: bool
    last_message_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatWithParticipants(ChatRead):
    
    initiator_name: str
    participant_name: str
    initiator_type: UserType
    participant_type: UserType
    initiator_profile_picture: Optional[str] = None
    participant_profile_picture: Optional[str] = None
    unread_count: int = 0
    last_message_preview: Optional[str] = None

class ChatList(BaseModel):
    
    chats: List[ChatWithParticipants]
    total: int
    page: int
    size: int
    has_next: bool
    has_prev: bool

class ChatSearch(BaseModel):
    
    query: Optional[str] = Field(
        None, max_length=100, description="Search query")
    project_type: Optional[str] = Field(
        None, max_length=100, description="Project type filter"
    )
    is_archived_by_initiator: Optional[bool] = None
    is_archived_by_participant: Optional[bool] = None
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")

class ChatStats(BaseModel):
    
    total_chats: int
    active_chats: int
    archived_chats: int
    total_messages: int
    unread_messages: int
    chats_this_month: int
    messages_this_month: int
