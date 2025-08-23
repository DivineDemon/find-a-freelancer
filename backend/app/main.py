from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.constants.seed_data_loader import seed_database
from app.core.config import settings
from app.core.db import engine
from app.core.db_init import init_db
from app.core.middleware import (
    LoggingMiddleware,
    RateLimitMiddleware,
    SecurityMiddleware,
)
from app.routers.auth_router import router as auth_router
from app.routers.chat_router import router as chat_router
from app.routers.index import router as main_router
from app.routers.message_router import router as message_router
from app.routers.payment_router import router as payment_router
from app.routers.user_router import router as user_router
from app.routers.websocket_router import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    await init_db(engine)
    await seed_database()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)

app.include_router(main_router)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(message_router)
app.include_router(payment_router)
app.include_router(websocket_router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
