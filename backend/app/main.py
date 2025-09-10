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
from app.routers.index import router as main_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
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

# Include all routers through the index router
app.include_router(main_router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
