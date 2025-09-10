from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

connection_string = settings.DATABASE_URL
seed_file = Path(__file__).resolve().parent.parent / \
    "constants" / "seed_data.json"

if not connection_string:
    raise RuntimeError("DATABASE_URL is not set in the environment variables.")

engine = create_async_engine(connection_string, echo=True, future=True)
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession
)


async def get_db():
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()
