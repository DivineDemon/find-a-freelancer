from fastapi import APIRouter

from app.routers.auth_router import router as auth_router
from app.routers.chat_router import router as chat_router
from app.routers.client_hunter_router import router as client_hunter_router
from app.routers.freelancer_router import router as freelancer_router
from app.routers.health_router import router as health_router
from app.routers.message_router import router as message_router
from app.routers.payment_router import router as payment_router
from app.routers.project_router import router as project_router
from app.routers.user_management_router import router as user_management_router
from app.routers.websocket_router import router as websocket_router

router = APIRouter()

router.include_router(health_router)

router.include_router(auth_router)

router.include_router(user_management_router)

router.include_router(client_hunter_router)

router.include_router(freelancer_router)

router.include_router(project_router)

router.include_router(chat_router)

router.include_router(message_router)

router.include_router(payment_router)

router.include_router(websocket_router)
