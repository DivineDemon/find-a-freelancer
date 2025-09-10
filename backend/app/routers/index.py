from fastapi import APIRouter

from app.routers.auth_router import router as auth_router
from app.routers.chat_router import router as chat_router
from app.routers.health_router import router as health_router
from app.routers.message_router import router as message_router
from app.routers.payment_router import router as payment_router
from app.routers.user_router import router as user_router

router = APIRouter()

router.include_router(health_router)
router.include_router(auth_router)
router.include_router(user_router)
router.include_router(chat_router)
router.include_router(message_router)
router.include_router(payment_router)
