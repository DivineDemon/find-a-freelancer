"""WebSocket manager for real-time chat functionality."""

import json
from typing import Dict, List, Optional, Set

from fastapi import WebSocket

from app.core.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time chat."""
    
    def __init__(self):
        # Store active connections by user ID
        self.active_connections: Dict[int, WebSocket] = {}
        # Store user's active chats for targeted messaging
        self.user_chats: Dict[int, Set[int]] = {}
        # Store chat participants for broadcast messaging
        self.chat_participants: Dict[int, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Connect a user to the WebSocket manager."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_chats[user_id] = set()
        logger.info(f"User {user_id} connected to WebSocket")
    
    def disconnect(self, user_id: int):
        """Disconnect a user from the WebSocket manager."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_chats:
            del self.user_chats[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")
    
    def add_user_to_chat(self, user_id: int, chat_id: int):
        """Add a user to a specific chat."""
        if user_id not in self.user_chats:
            self.user_chats[user_id] = set()
        self.user_chats[user_id].add(chat_id)
        
        if chat_id not in self.chat_participants:
            self.chat_participants[chat_id] = set()
        self.chat_participants[chat_id].add(user_id)
    
    def remove_user_from_chat(self, user_id: int, chat_id: int):
        """Remove a user from a specific chat."""
        if user_id in self.user_chats:
            self.user_chats[user_id].discard(chat_id)
        
        if chat_id in self.chat_participants:
            self.chat_participants[chat_id].discard(user_id)
            if not self.chat_participants[chat_id]:
                del self.chat_participants[chat_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(
                    json.dumps(message)
                )
                return True
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                return False
        return False
    
    async def send_chat_message(
        self, 
        message: dict, 
        chat_id: int, 
        exclude_user: Optional[int] = None
    ):
        """Send a message to all participants in a chat."""
        if chat_id not in self.chat_participants:
            return
        
        sent_count = 0
        for user_id in self.chat_participants[chat_id]:
            if user_id != exclude_user:  # Don't send back to sender
                if await self.send_personal_message(message, user_id):
                    sent_count += 1
        
        logger.info(
            f"Sent message to {sent_count} users in chat {chat_id}"
        )
        return sent_count
    
    async def broadcast_message(
        self, 
        message: dict, 
        exclude_user: Optional[int] = None
    ):
        """Broadcast a message to all connected users."""
        sent_count = 0
        for user_id in list(self.active_connections.keys()):
            if user_id != exclude_user:
                if await self.send_personal_message(message, user_id):
                    sent_count += 1
        
        logger.info(
            f"Broadcasted message to {sent_count} users"
        )
        return sent_count
    
    def get_online_users(self) -> List[int]:
        """Get list of currently online user IDs."""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a specific user is online."""
        return user_id in self.active_connections
    
    def get_user_chats(self, user_id: int) -> Set[int]:
        """Get all chats a user is participating in."""
        return self.user_chats.get(user_id, set())


# Global connection manager instance
manager = ConnectionManager()
