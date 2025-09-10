from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import engine, init_db
from app.core.middleware import (
    LoggingMiddleware,
    RateLimitMiddleware,
    SecurityMiddleware,
)
from app.routers.index import router as main_router
from app.routers.websocket_router import router as websocket_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db(engine)
    yield
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

app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)

app.include_router(main_router)
app.include_router(websocket_router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
