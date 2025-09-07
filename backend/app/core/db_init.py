"""Database initialization and setup utilities."""
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.base import Base
from app.core.logger import get_logger

logger = get_logger(__name__)


async def init_db(engine: AsyncEngine) -> None:
    """Initialize the database by creating all tables."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


async def drop_db(engine: AsyncEngine) -> None:
    """Drop all database tables (use with caution!)."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping database tables: {e}")
        raise


async def reset_db(engine: AsyncEngine) -> None:
    """Reset the database by dropping and recreating all tables."""
    try:
        logger.info("Resetting database...")
        await drop_db(engine)
        await init_db(engine)
        logger.info("Database reset completed successfully")
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        raise
