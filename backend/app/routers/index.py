from fastapi import APIRouter

from app.routers.health_router import router as health_router

router = APIRouter()

router.include_router(health_router)