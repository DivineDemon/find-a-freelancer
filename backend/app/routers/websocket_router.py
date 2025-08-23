"""WebSocket router for real-time chat functionality."""

import json
from typing import Annotated, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logger import get_logger
from app.core.websocket_manager import manager
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.schemas.message_schema import WebSocketMessage
from app.schemas.user_schema import OnlineUsersResponse, UserStatusResponse
from app.utils.content_filter import content_filter

logger = get_logger(__name__)

router = APIRouter(tags=["WebSocket Chat"])


async def get_user_from_token(token: str, session: AsyncSession) -> User:
    """Extract user from JWT token."""
    # This is a simplified version - in production, you'd want proper JWT validation
    try:
        # For now, we'll use a simple approach - in production, 
        # use proper JWT validation
        # This is just for demonstration - implement proper JWT validation here
        # TODO: Implement proper JWT validation
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT validation not implemented yet"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    token: Optional[str] = None
):
    """WebSocket endpoint for real-time chat."""
    try:
        # Accept the connection first
        await websocket.accept()
        
        # Validate user (in production, validate JWT token)
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Get user from token
        try:
            # For now, we'll use a simple approach - in production, 
            # use proper JWT validation
            # This is just for demonstration - implement proper JWT validation here
            # For now, we'll skip token validation and just get the user
            user_result = await session.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            if not user:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Connect user to WebSocket manager
        user_id_int = int(user.id) if user.id is not None else 0
        await manager.connect(websocket, user_id_int)
        
        # Add user to their existing chats
        user_chats_result = await session.execute(
            select(Chat).where(
                (Chat.initiator_id == user.id) | (Chat.participant_id == user.id)
            )
        )
        user_chats = user_chats_result.scalars().all()
        
        for chat in user_chats:
            chat_id_int = int(chat.id) if chat.id is not None else 0
            manager.add_user_to_chat(user_id_int, chat_id_int)
        
        # Send connection confirmation
        await websocket.send_text(
            json.dumps({
                "type": "connection",
                "message": f"Connected as {user.full_name}",
                "user_id": user.id,
                "timestamp": "now"
            })
        )
        
        # Main message handling loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data.get("type") == "chat":
                    await handle_chat_message(message_data, user, session)
                elif message_data.get("type") == "typing":
                    await handle_typing_indicator(message_data, user)
                elif message_data.get("type") == "read":
                    await handle_read_receipt(message_data, user)
                else:
                    # Echo back unknown message types
                    await websocket.send_text(
                        json.dumps({
                            "type": "error",
                            "message": "Unknown message type",
                            "timestamp": "now"
                        })
                    )
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                # Log error and send error message to client
                await websocket.send_text(
                    json.dumps({
                        "type": "error",
                        "message": f"Error processing message: {str(e)}",
                        "timestamp": "now"
                    })
                )
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        # Log any other errors
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        manager.disconnect(user_id)


async def handle_chat_message(message_data: dict, user: User, session: AsyncSession):
    """Handle incoming chat messages."""
    try:
        chat_id = message_data.get("chat_id")
        content = message_data.get("content", "")
        content_type = message_data.get("content_type", "text")
        
        if not chat_id or not content:
            return
        
        # Verify user has access to this chat
        chat_result = await session.execute(
            select(Chat).where(
                (Chat.id == chat_id) &
                ((Chat.initiator_id == user.id) | (Chat.participant_id == user.id)) &
                (Chat.status == "active")
            )
        )
        chat = chat_result.scalar_one_or_none()
        
        if not chat:
            return
        
        # Filter content for violations
        filtered_content, violations, is_clean = content_filter.filter_message(content)
        
        # Create message in database
        message = Message(
            content=filtered_content,
            content_type=content_type,
            chat_id=chat_id,
            sender_id=user.id,
            is_flagged=not is_clean,
            flag_reason=", ".join(violations) if violations else None
        )
        
        session.add(message)
        
        # Update chat's last_message_at
        from datetime import datetime, timezone
        setattr(chat, 'last_message_at', \
            datetime.now(timezone.utc).replace(tzinfo=None))
        session.add(chat)
        
        await session.commit()
        await session.refresh(message)
        
        # Prepare message for broadcast
        from app.schemas.message_schema import MessageWithSender
        
        message_with_sender = MessageWithSender(
            id=message.id,
            content=filtered_content,
            content_type=content_type,
            chat_id=chat_id,
            sender_id=user.id,
            is_flagged=not is_clean,
            flag_reason=", ".join(violations) if violations else None,
            is_edited=False,
            original_content=None,
            is_deleted=False,
            deleted_at=None,
            edited_at=None,
            created_at=message.created_at,
            updated_at=message.updated_at,
            sender_name=user.full_name,
            sender_type=user.user_type,
            sender_avatar=None
        )
        
        ws_message = WebSocketMessage(
            type="chat",
            chat_id=chat_id,
            message=message_with_sender,
            timestamp=message.created_at,
            notification=None,
            status="sent"
        )
        
        # Send message to all participants in the chat
        await manager.send_chat_message(
            ws_message.dict(),
            chat_id,
            exclude_user=user.id
        )
        
        # Send confirmation back to sender
        await manager.send_personal_message(
            {
                "type": "message_sent",
                "message_id": message.id,
                "chat_id": chat_id,
                "timestamp": "now"
            },
            user.id
        )
        
    except Exception as e:
        logger.error(f"Error handling chat message: {e}")


async def handle_typing_indicator(message_data: dict, user: User):
    """Handle typing indicators."""
    try:
        chat_id = message_data.get("chat_id")
        is_typing = message_data.get("is_typing", False)
        
        if not chat_id:
            return
        
        # Send typing indicator to other chat participants
        typing_message = {
            "type": "typing",
            "chat_id": chat_id,
            "user_id": user.id,
            "user_name": user.full_name,
            "is_typing": is_typing,
            "timestamp": "now"
        }
        
        await manager.send_chat_message(
            typing_message,
            chat_id,
            exclude_user=user.id
        )
        
    except Exception as e:
        logger.error(f"Error handling typing indicator: {e}")


async def handle_read_receipt(message_data: dict, user: User):
    """Handle read receipts."""
    try:
        chat_id = message_data.get("chat_id")
        message_id = message_data.get("message_id")
        
        if not chat_id or not message_id:
            return
        
        # Send read receipt to message sender
        read_receipt = {
            "type": "read_receipt",
            "chat_id": chat_id,
            "message_id": message_id,
            "read_by_user_id": user.id,
            "read_by_user_name": user.full_name,
            "timestamp": "now"
        }
        
        # Get message sender
        from app.core.db import get_session
        session_gen = get_session()
        session = await session_gen.__anext__()
        try:
            message_result = await session.execute(
                select(Message).where(Message.id == message_id)
            )
            message = message_result.scalar_one_or_none()
            
            if message and message.sender_id != user.id:
                await manager.send_personal_message(
                    read_receipt,
                    message.sender_id
                )
        finally:
            await session.close()
        
    except Exception as e:
        logger.error(f"Error handling read receipt: {e}")


@router.get("/online-users", response_model=OnlineUsersResponse)
async def get_online_users():
    """Get list of currently online users."""
    return OnlineUsersResponse(
        online_users=manager.get_online_users(),
        total_online=len(manager.get_online_users())
    )


@router.get("/user-status/{user_id}", response_model=UserStatusResponse)
async def get_user_status(user_id: int):
    """Get online status of a specific user."""
    return UserStatusResponse(
        user_id=user_id,
        is_online=manager.is_user_online(user_id)
    )
