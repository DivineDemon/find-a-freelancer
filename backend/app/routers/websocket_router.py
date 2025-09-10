import json
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.jwt import verify_access_token
from app.core.logger import get_logger
from app.core.websocket_manager import websocket_manager
from app.models.chat import Chat
from app.schemas.websocket_schema import ChatStatusResponse

logger = get_logger(__name__)

router = APIRouter()


async def authenticate_websocket(websocket: WebSocket, token: str) -> dict:
    try:
        payload = verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": int(user_id)}
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        await websocket.close(code=1008, reason="Authentication failed")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def verify_chat_access(chat_id: str, user_id: int, session: AsyncSession) -> Chat:
    result = await session.execute(
        select(Chat).where(
            and_(
                Chat.id == int(chat_id),
                or_(
                    Chat.initiator_id == user_id,
                    Chat.participant_id == user_id
                )
            )
        )
    )
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(
            status_code=403, detail="Access denied to chat"
        )
    
    return chat


@router.websocket("/ws/chat/{chat_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    chat_id: str,
    token: str,
    session: Annotated[AsyncSession, Depends(get_db)]
):
    try:
        auth_data = await authenticate_websocket(websocket, token)
        user_id = auth_data["user_id"]
        
        await verify_chat_access(chat_id, user_id, session)
        
        await websocket_manager.connect(websocket, chat_id, user_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                await handle_websocket_message(
                    websocket, chat_id, user_id, message_data, session
                )
                
        except WebSocketDisconnect:
            websocket_manager.disconnect(websocket)
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except Exception:
            pass


async def handle_websocket_message(
    websocket: WebSocket,
    chat_id: str,
    user_id: int,
    message_data: dict,
    session: AsyncSession
):
    message_type = message_data.get("type")
    
    if message_type == "message":
        content = message_data.get("data", {}).get("content", "")
        content_type = message_data.get("data", {}).get("content_type", "text")
        
        if content.strip():
            try:
                from app.models.message import Message
                from app.models.user import User
                
                user = await session.get(User, user_id)
                if not user:
                    logger.error(f"User {user_id} not found")
                    return
                
                sender_name = f"{user.first_name} {user.last_name}"
                sender_avatar = user.profile_picture
                
                message = Message(
                    chat_id=int(chat_id),
                    sender_id=user_id,
                    content=content.strip(),
                    content_type=content_type
                )
                created_at = datetime.utcnow().isoformat()
                
                session.add(message)
                await session.flush()
                message_id = message.id
                await session.commit()
                
                message_data = {
                    "id": message_id,
                    "chat_id": int(chat_id),
                    "sender_id": user_id,
                    "content": content.strip(),
                    "content_type": content_type,
                    "created_at": created_at,
                    "sender_name": sender_name,
                    "sender_avatar": sender_avatar,
                }
                
                await websocket_manager.broadcast_message(
                    chat_id, message_data, exclude_user=user_id
                )
                
            except Exception as e:
                logger.error(f"Error creating message: {e}")
                await session.rollback()
        
    elif message_type == "typing":
        is_typing = message_data.get("data", {}).get("is_typing", False)
        await websocket_manager.broadcast_typing(chat_id, user_id, is_typing)
        
    elif message_type == "chat_history":
        page = message_data.get("data", {}).get("page", 1)
        size = message_data.get("data", {}).get("size", 20)
        
        try:
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload

            from app.models.message import Message
            
            query = select(Message).options(
                selectinload(Message.sender)
            ).where(
                Message.chat_id == int(chat_id)
            ).order_by(Message.created_at.desc()).offset((page - 1) * size).limit(size)
            
            result = await session.execute(query)
            messages = result.scalars().all()
            
            messages_data = []
            for message in messages:
                sender = message.sender
                message_data = {
                    "id": message.id,
                    "chat_id": message.chat_id,
                    "sender_id": message.sender_id,
                    "content": message.content,
                    "content_type": message.content_type,
                    "created_at": message.created_at.isoformat(),
                    "sender_name": f"{sender.first_name} {sender.last_name}",
                    "sender_avatar": sender.profile_picture,
                }
                messages_data.append(message_data)
            
            await websocket_manager.send_personal_message(
                json.dumps({
                    "type": "chat_history",
                    "data": messages_data
                }),
                websocket
            )
            
        except Exception as e:
            logger.error(f"Error fetching chat history: {e}")
            await websocket_manager.send_personal_message(
                json.dumps({
                    "type": "error",
                    "data": {"error": "Failed to load chat history"}
                }),
                websocket
            )
        
    elif message_type == "ping":
        await websocket_manager.send_personal_message(
            json.dumps({
                "type": "pong", 
                "data": {"timestamp": message_data.get("data", {}).get("timestamp")}
            }),
            websocket
        )
        
    else:
        logger.warning(f"Unknown message type: {message_type}")


@router.get("/ws/status/{chat_id}", response_model=ChatStatusResponse)
async def get_chat_status(chat_id: str):
    online_users = websocket_manager.get_online_users_in_chat(chat_id)
    return ChatStatusResponse(
        chat_id=chat_id,
        online_users=list(online_users),
        connection_count=len(websocket_manager.get_chat_connections(chat_id))
    )
