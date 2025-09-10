from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.logger import get_logger
from app.core.websocket_manager import websocket_manager

logger = get_logger(__name__)


async def broadcast_new_message(chat_id: str, message_data: Dict[str, Any]):
    try:
        await websocket_manager.broadcast_message(chat_id, message_data)
    except Exception as e:
        logger.error(f"Error broadcasting message to chat {chat_id}: {e}")


async def broadcast_user_typing(chat_id: str, user_id: int, is_typing: bool):
    try:
        await websocket_manager.broadcast_typing(chat_id, user_id, is_typing)
    except Exception as e:
        logger.error(f"Error broadcasting typing status: {e}")


async def broadcast_user_status_change(chat_id: str, user_id: int, status: str):
    try:
        await websocket_manager.broadcast_user_status(chat_id, user_id, status)
    except Exception as e:
        logger.error(f"Error broadcasting status change: {e}")


def create_message_websocket_data(
    message_id: int,
    chat_id: int,
    sender_id: int,
    content: str,
    content_type: str,
    sender_name: str,
    sender_avatar: Optional[str] = None
) -> Dict[str, Any]:
    return {
        "id": message_id,
        "chat_id": chat_id,
        "sender_id": sender_id,
        "content": content,
        "content_type": content_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sender_name": sender_name,
        "sender_avatar": sender_avatar
    }


def create_typing_websocket_data(
    user_id: int, chat_id: str, is_typing: bool
) -> Dict[str, Any]:
    return {
        "type": "typing",
        "data": {
            "user_id": user_id,
            "chat_id": chat_id,
            "is_typing": is_typing
        }
    }


def create_status_websocket_data(
    user_id: int, chat_id: str, status: str
) -> Dict[str, Any]:
    return {
        "type": "user_status",
        "data": {
            "user_id": user_id,
            "chat_id": chat_id,
            "status": status
        }
    }


def get_online_users_in_chat(chat_id: str) -> set:
    return websocket_manager.get_online_users_in_chat(chat_id)


def is_user_online(user_id: int) -> bool:
    return websocket_manager.is_user_online(user_id)
