"""Chat router for managing conversations between users."""

from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User, UserType
from app.routers.auth_router import get_current_user
from app.schemas.chat_schema import (
    ChatCreate,
    ChatList,
    ChatRead,
    ChatStats,
    ChatUpdate,
    ChatWithParticipants,
)

router = APIRouter(prefix="/chats", tags=["Chat Management"])


async def get_chat_participant(
    chat_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> Chat:
    """Get chat and verify current user is a participant."""
    from sqlalchemy.orm import selectinload

    result = await session.execute(
        select(Chat)
        .options(
            selectinload(Chat.initiator),
            selectinload(Chat.participant)
        )
        .where(
            and_(
                Chat.id == chat_id,
                or_(
                    Chat.initiator_id == current_user.id,
                    Chat.participant_id == current_user.id
                )
            )
        )
    )
    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or access denied"
        )

    return chat


@router.post("/", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_data: ChatCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Create a new chat with another user."""
    # Verify participant exists and is different from current user
    if chat_data.participant_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create chat with yourself"
        )

    # Check if participant exists
    participant_result = await session.execute(
        select(User).where(User.id == chat_data.participant_id)
    )
    participant = participant_result.scalar_one_or_none()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant user not found"
        )

    # Check if chat already exists between these users
    existing_chat_result = await session.execute(
        select(Chat).where(
            or_(
                and_(
                    Chat.initiator_id == current_user.id,
                    Chat.participant_id == chat_data.participant_id
                ),
                and_(
                    Chat.initiator_id == chat_data.participant_id,
                    Chat.participant_id == current_user.id
                )
            )
        )
    )
    existing_chat = existing_chat_result.scalar_one_or_none()

    if existing_chat:
        # Return existing chat instead of creating duplicate
        return existing_chat

    # Create new chat
    chat = Chat(
        initiator_id=current_user.id,
        participant_id=chat_data.participant_id,
        project_title=chat_data.project_title,
        project_description=chat_data.project_description,
        project_budget=chat_data.project_budget
    )

    session.add(chat)
    await session.commit()
    await session.refresh(chat)

    return chat


@router.get("/", response_model=ChatList)
async def list_user_chats(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    is_archived_by_initiator: Optional[bool] = Query(
        None, description="Filter by archive status for initiator"),
    is_archived_by_participant: Optional[bool] = Query(
        None, description="Filter by archive status for participant"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size")
):
    """List all chats for the current user with pagination."""
    # Build base query
    query = select(Chat).where(
        or_(
            Chat.initiator_id == current_user.id,
            Chat.participant_id == current_user.id
        )
    )

    # Apply filters based on user role
    if current_user.user_type == UserType.FREELANCER:
        if is_archived_by_initiator is not None:
            query = query.where(
                Chat.is_archived_by_initiator == is_archived_by_initiator)
    else:  # CLIENT_HUNTER
        if is_archived_by_participant is not None:
            query = query.where(
                Chat.is_archived_by_participant == is_archived_by_participant)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(desc(Chat.last_message_at), desc(Chat.updated_at))
    query = query.offset((page - 1) * size).limit(size)

    # Execute query with relationships loaded
    from sqlalchemy.orm import selectinload

    query = query.options(
        selectinload(Chat.initiator),
        selectinload(Chat.participant)
    )

    result = await session.execute(query)
    chats = result.scalars().all()

    # Build response with participant information
    chat_list = []
    for chat in chats:

        # Get last message for preview
        last_message_result = await session.execute(
            select(Message).where(
                Message.chat_id == chat.id
            ).order_by(desc(Message.created_at)).limit(1)
        )
        last_message = last_message_result.scalar_one_or_none()

        # Get unread count
        unread_result = await session.execute(
            select(func.count(Message.id)).where(
                and_(
                    Message.chat_id == chat.id,
                    Message.sender_id != current_user.id
                )
            )
        )
        unread_count = unread_result.scalar() or 0

        # Build participant names and types
        initiator_name = (
            chat.initiator.full_name if chat.initiator else "Unknown"
        )
        participant_name = (
            chat.participant.full_name if chat.participant else "Unknown"
        )
        initiator_type = (
            chat.initiator.user_type if chat.initiator else UserType.CLIENT_HUNTER
        )
        participant_type = (
            chat.participant.user_type if chat.participant else UserType.CLIENT_HUNTER
        )

        # Build message preview
        if last_message and len(str(last_message.content)) > 100:
            message_preview = str(last_message.content)[:100] + "..."
        else:
            message_preview = str(
                last_message.content) if last_message else None

        chat_with_participants = ChatWithParticipants(
            **chat.__dict__,
            initiator_name=initiator_name,
            participant_name=participant_name,
            initiator_type=initiator_type,
            participant_type=participant_type,
            unread_count=unread_count,
            last_message_preview=message_preview
        )
        chat_list.append(chat_with_participants)

    return ChatList(
        chats=chat_list,
        total=total,
        page=page,
        size=size,
        has_next=page * size < total,
        has_prev=page > 1
    )


@router.get("/{chat_id}", response_model=ChatWithParticipants)
async def get_chat(
    chat: Annotated[Chat, Depends(get_chat_participant)]
):
    """Get detailed information about a specific chat."""
    # Build participant names and types
    initiator_name = (
        chat.initiator.full_name if chat.initiator else "Unknown"
    )
    participant_name = (
        chat.participant.full_name if chat.participant else "Unknown"
    )
    initiator_type = (
        chat.initiator.user_type if chat.initiator else UserType.CLIENT_HUNTER
    )
    participant_type = (
        chat.participant.user_type if chat.participant else UserType.CLIENT_HUNTER
    )

    return ChatWithParticipants(
        **chat.__dict__,
        initiator_name=initiator_name,
        participant_name=participant_name,
        initiator_type=initiator_type,
        participant_type=participant_type,
        unread_count=0,  # Will be calculated separately
        last_message_preview=None  # Will be calculated separately
    )


@router.put("/{chat_id}", response_model=ChatRead)
async def update_chat(
    chat_update: ChatUpdate,
    chat: Annotated[Chat, Depends(get_chat_participant)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Update chat information."""
    # Update fields
    for field, value in chat_update.dict(exclude_unset=True).items():
        setattr(chat, field, value)

    # Update timestamp
    chat.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    session.add(chat)
    await session.commit()
    await session.refresh(chat)

    return chat


@router.post("/{chat_id}/archive", response_model=ChatRead)
async def archive_chat(
    chat: Annotated[Chat, Depends(get_chat_participant)],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Archive a chat for the current user."""
    # Determine if current user is initiator or participant
    if chat.initiator_id == current_user.id:
        chat.is_archived_by_initiator = True
    else:
        chat.is_archived_by_participant = True

    chat.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    session.add(chat)
    await session.commit()
    await session.refresh(chat)

    return chat


@router.post("/{chat_id}/unarchive", response_model=ChatRead)
async def unarchive_chat(
    chat: Annotated[Chat, Depends(get_chat_participant)],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Unarchive a chat for the current user."""
    # Determine if current user is initiator or participant
    if chat.initiator_id == current_user.id:
        chat.is_archived_by_initiator = False
    else:
        chat.is_archived_by_participant = False

    chat.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    session.add(chat)
    await session.commit()
    await session.refresh(chat)

    return chat


@router.get("/stats/summary", response_model=ChatStats)
async def get_chat_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get chat statistics for the current user."""
    # Get total chats
    total_chats_result = await session.execute(
        select(func.count(Chat.id)).where(
            or_(
                Chat.initiator_id == current_user.id,
                Chat.participant_id == current_user.id
            )
        )
    )
    total_chats = total_chats_result.scalar() or 0

    # Get active chats (not archived by current user)
    if current_user.user_type == UserType.FREELANCER:
        active_chats_result = await session.execute(
            select(func.count(Chat.id)).where(
                and_(
                    or_(
                        Chat.initiator_id == current_user.id,
                        Chat.participant_id == current_user.id
                    ),
                    Chat.is_archived_by_initiator.is_(False)
                )
            )
        )
    else:  # CLIENT_HUNTER
        active_chats_result = await session.execute(
            select(func.count(Chat.id)).where(
                and_(
                    or_(
                        Chat.initiator_id == current_user.id,
                        Chat.participant_id == current_user.id
                    ),
                    Chat.is_archived_by_participant.is_(False)
                )
            )
        )
    active_chats = active_chats_result.scalar() or 0

    # Get archived chats (archived by current user)
    if current_user.user_type == UserType.FREELANCER:
        archived_chats_result = await session.execute(
            select(func.count(Chat.id)).where(
                and_(
                    or_(
                        Chat.initiator_id == current_user.id,
                        Chat.participant_id == current_user.id
                    ),
                    Chat.is_archived_by_initiator.is_(True)
                )
            )
        )
    else:  # CLIENT_HUNTER
        archived_chats_result = await session.execute(
            select(func.count(Chat.id)).where(
                and_(
                    or_(
                        Chat.initiator_id == current_user.id,
                        Chat.participant_id == current_user.id
                    ),
                    Chat.is_archived_by_participant.is_(True)
                )
            )
        )
    archived_chats = archived_chats_result.scalar() or 0

    # Get total messages
    total_messages_result = await session.execute(
        select(func.count(Message.id)).where(
            Message.chat_id.in_(
                select(Chat.id).where(
                    or_(
                        Chat.initiator_id == current_user.id,
                        Chat.participant_id == current_user.id
                    )
                )
            )
        )
    )
    total_messages = total_messages_result.scalar() or 0

    # Unread message tracking not implemented yet
    unread_messages = 0

    # Get monthly stats
    current_month = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    chats_this_month_result = await session.execute(
        select(func.count(Chat.id)).where(
            and_(
                or_(
                    Chat.initiator_id == current_user.id,
                    Chat.participant_id == current_user.id
                ),
                Chat.created_at >= current_month
            )
        )
    )
    chats_this_month = chats_this_month_result.scalar() or 0

    messages_this_month_result = await session.execute(
        select(func.count(Message.id)).where(
            and_(
                Message.chat_id.in_(
                    select(Chat.id).where(
                        or_(
                            Chat.initiator_id == current_user.id,
                            Chat.participant_id == current_user.id
                        )
                    )
                ),
                Message.created_at >= current_month
            )
        )
    )
    messages_this_month = messages_this_month_result.scalar() or 0

    return ChatStats(
        total_chats=total_chats,
        active_chats=active_chats,
        archived_chats=archived_chats,
        total_messages=total_messages,
        unread_messages=unread_messages,
        chats_this_month=chats_this_month,
        messages_this_month=messages_this_month
    )
