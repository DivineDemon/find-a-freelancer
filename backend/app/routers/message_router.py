"""Message router for managing chat messages."""

from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User, UserType
from app.routers.chat_router import get_chat_participant
from app.schemas.message_schema import (
    MessageCreate,
    MessageList,
    MessageRead,
    MessageWithSender,
)
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/messages", tags=["Message Management"])


@router.post("/", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """Send a new message in a chat."""
    # Verify chat exists and user is a participant
    chat_result = await session.execute(
        select(Chat).where(
            and_(
                Chat.id == message_data.chat_id,
                or_(
                    Chat.initiator_id == current_user.id,
                    Chat.participant_id == current_user.id
                )
            )
        )
    )
    chat = chat_result.scalar_one_or_none()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or access denied"
        )

    # Create message
    message = Message(
        content=message_data.content,
        content_type=message_data.content_type,
        chat_id=message_data.chat_id,
        sender_id=current_user.id
    )

    session.add(message)

    # Update chat's last_message_at
    setattr(chat, 'last_message_at', datetime.now(
        timezone.utc).replace(tzinfo=None))
    session.add(chat)

    await session.commit()
    await session.refresh(message)

    return message


@router.get("/chat/{chat_id}", response_model=MessageList)
async def get_chat_messages(
    chat: Annotated[Chat, Depends(get_chat_participant)],
    session: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=200, description="Page size")
):
    """Get messages from a specific chat with pagination."""
    # Get total count
    count_query = select(func.count(Message.id)).where(
        Message.chat_id == chat.id
    )
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Get messages with pagination and sender information
    query = select(Message).options(
        selectinload(Message.sender)
    ).where(
        Message.chat_id == chat.id
    ).order_by(desc(Message.created_at))

    query = query.offset((page - 1) * size).limit(size)
    result = await session.execute(query)
    messages = result.scalars().all()

    # Build response with sender information
    message_list = []
    for msg in messages:
        message_with_sender = MessageWithSender(
            **msg.__dict__,
            sender_name=msg.sender.full_name if msg.sender else "Unknown",
            sender_type=msg.sender.user_type if msg.sender else UserType.CLIENT_HUNTER,
            sender_avatar=None  # Will be implemented later
        )
        message_list.append(message_with_sender)

    return MessageList(
        messages=message_list,
        total=total,
        page=page,
        size=size,
        has_next=page * size < total,
        has_prev=page > 1
    )


@router.get("/{message_id}", response_model=MessageWithSender)
async def get_message(
    message_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """Get a specific message by ID."""
    # Get message with sender information
    result = await session.execute(
        select(Message).options(
            selectinload(Message.sender)
        ).where(
            Message.id == message_id
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Verify user has access to the chat
    chat_result = await session.execute(
        select(Chat).where(
            and_(
                Chat.id == message.chat_id,
                or_(
                    Chat.initiator_id == current_user.id,
                    Chat.participant_id == current_user.id
                )
            )
        )
    )
    chat = chat_result.scalar_one_or_none()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this message"
        )

    return MessageWithSender(
        **message.__dict__,
        sender_name=message.sender.full_name if message.sender else "Unknown",
        sender_type=message.sender.user_type if message.sender else
        UserType.CLIENT_HUNTER,
        sender_avatar=None  # Will be implemented later
    )




@router.get("/search", response_model=MessageList)
async def search_messages(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    query: str = Query(
        ...,
        min_length=1,
        max_length=100,
        description="Search query"
    ),
    chat_id: Optional[int] = Query(
        None, description="Search within specific chat"),
    sender_id: Optional[int] = Query(
        None, description="Search messages from specific user"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size")
):
    """Search messages across user's chats."""
    # Build base query for user's chats
    user_chats_query = select(Chat.id).where(
        or_(
            Chat.initiator_id == current_user.id,
            Chat.participant_id == current_user.id
        )
    )

    # Build message search query
    message_query = select(Message).where(
        and_(
            Message.chat_id.in_(user_chats_query),
            Message.content.ilike(f"%{query}%")
        )
    )

    # Apply additional filters
    if chat_id:
        message_query = message_query.where(Message.chat_id == chat_id)
    if sender_id:
        message_query = message_query.where(Message.sender_id == sender_id)

    # Get total count
    count_query = select(func.count()).select_from(message_query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    message_query = message_query.order_by(desc(Message.created_at))
    message_query = message_query.offset((page - 1) * size).limit(size)

    # Execute query with sender information
    message_query = message_query.options(
        selectinload(Message.sender)
    )

    result = await session.execute(message_query)
    messages = result.scalars().all()

    # Build response with sender information
    message_list = []
    for msg in messages:
        message_with_sender = MessageWithSender(
            **msg.__dict__,
            sender_name=msg.sender.full_name if msg.sender else "Unknown",
            sender_type=msg.sender.user_type if msg.sender else UserType.CLIENT_HUNTER,
            sender_avatar=None  # Will be implemented later
        )
        message_list.append(message_with_sender)

    return MessageList(
        messages=message_list,
        total=total,
        page=page,
        size=size,
        has_next=page * size < total,
        has_prev=page > 1
    )
