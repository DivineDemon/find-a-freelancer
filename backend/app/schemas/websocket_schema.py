from typing import Literal, Optional

from pydantic import BaseModel


class WebSocketMessage(BaseModel):
    type: Literal["message", "typing", "user_status", "error", "connection"]
    data: dict


class MessageData(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    content: str
    content_type: str
    created_at: str
    sender_name: str
    sender_avatar: Optional[str] = None


class TypingData(BaseModel):
    user_id: int
    chat_id: str
    is_typing: bool


class UserStatusData(BaseModel):
    user_id: int
    chat_id: str
    status: Literal["online", "offline", "typing"]


class ErrorData(BaseModel):
    error: str
    message: Optional[str] = None


class ConnectionData(BaseModel):
    status: Literal["connected", "disconnected"]
    chat_id: str
    user_id: int


class ChatStatusResponse(BaseModel):
    chat_id: str
    online_users: list[int]
    connection_count: int
