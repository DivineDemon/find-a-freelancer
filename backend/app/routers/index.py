from fastapi import APIRouter

from app.routers.auth_router import router as auth_router
from app.routers.chat_router import router as chat_router
from app.routers.health_router import router as health_router
from app.routers.message_router import router as message_router
from app.routers.payment_router import router as payment_router
from app.routers.user_router import router as user_router
from app.routers.websocket_router import router as websocket_router

# Create main router
router = APIRouter()

# Include all routers with their prefixes
router.include_router(health_router)  # Health check on "/"
router.include_router(auth_router, prefix="/auth")
router.include_router(user_router, prefix="/users")  # Users on "/users"
router.include_router(chat_router, prefix="/chats")
router.include_router(message_router, prefix="/messages")
router.include_router(payment_router, prefix="/payments")
router.include_router(websocket_router, prefix="/ws")
