import asyncio
import json
from typing import Dict, Optional, Set

from fastapi import WebSocket

from app.core.logger import get_logger

logger = get_logger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        self.connection_to_user: Dict[WebSocket, int] = {}
        self.connection_to_chat: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, chat_id: str, user_id: int):
        await websocket.accept()
        
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        
        self.active_connections[chat_id].add(websocket)
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        
        self.user_connections[user_id].add(websocket)
        self.connection_to_user[websocket] = user_id
        self.connection_to_chat[websocket] = chat_id
        
        await self.broadcast_user_status(chat_id, user_id, "online")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connection_to_user:
            user_id = self.connection_to_user[websocket]
            chat_id = self.connection_to_chat.get(websocket)
            
            if chat_id and chat_id in self.active_connections:
                self.active_connections[chat_id].discard(websocket)
                if not self.active_connections[chat_id]:
                    del self.active_connections[chat_id]
            
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(websocket)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            del self.connection_to_user[websocket]
            if websocket in self.connection_to_chat:
                del self.connection_to_chat[websocket]
            
            if chat_id:
                asyncio.create_task(
                    self.broadcast_user_status(chat_id, user_id, "offline")
                )

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast_to_chat(
        self, chat_id: str, message: dict, exclude_user: Optional[int] = None
    ):
        if chat_id not in self.active_connections:
            return
        
        if not self.active_connections[chat_id]:
            return
        
        message_json = json.dumps(message)
        disconnected_websockets = set()
        
        for websocket in self.active_connections[chat_id]:
            try:
                current_user = self.connection_to_user.get(websocket)
                
                if exclude_user and current_user == exclude_user:
                    continue
                
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error broadcasting to chat {chat_id}: {e}")
                disconnected_websockets.add(websocket)
        
        for websocket in disconnected_websockets:
            self.disconnect(websocket)

    async def broadcast_user_status(self, chat_id: str, user_id: int, status: str):
        message = {
            "type": "user_status",
            "data": {
                "user_id": user_id,
                "status": status,
                "chat_id": chat_id
            }
        }
        await self.broadcast_to_chat(
            chat_id, message, exclude_user=user_id
        )

    async def broadcast_typing(self, chat_id: str, user_id: int, is_typing: bool):
        message = {
            "type": "typing",
            "data": {
                "user_id": user_id,
                "is_typing": is_typing,
                "chat_id": chat_id
            }
        }
        await self.broadcast_to_chat(
            chat_id, message, exclude_user=user_id
        )

    async def broadcast_message(
        self, chat_id: str, message_data: dict, exclude_user: Optional[int] = None
    ):
        message = {
            "type": "message",
            "data": message_data
        }
        await self.broadcast_to_chat(chat_id, message, exclude_user=exclude_user)

    def get_online_users_in_chat(self, chat_id: str) -> Set[int]:
        if chat_id not in self.active_connections:
            return set()
        
        return {
            self.connection_to_user[ws]
            for ws in self.active_connections[chat_id]
            if ws in self.connection_to_user
        }

    def is_user_online(self, user_id: int) -> bool:
        return (
            user_id in self.user_connections \
                and len(self.user_connections[user_id]) > 0
        )

    def get_user_connections(self, user_id: int) -> Set[WebSocket]:
        return self.user_connections.get(user_id, set())

    def get_chat_connections(self, chat_id: str) -> Set[WebSocket]:
        return self.active_connections.get(chat_id, set())


websocket_manager = WebSocketManager()
