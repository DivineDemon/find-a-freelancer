import argparse
import asyncio
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.base import BaseModel
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

connection_string = settings.DATABASE_URL

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


async def init_db(engine: AsyncEngine) -> None:
    try:
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


async def drop_db(engine: AsyncEngine) -> None:
    try:
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.drop_all)
    except Exception as e:
        logger.error(f"Error dropping database tables: {e}")
        raise


async def reset_db(engine: AsyncEngine) -> None:
    try:
        await drop_db(engine)
        await init_db(engine)
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        raise


async def create_tables():
    try:
        await init_db(engine)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        return False


async def reset_database():
    try:
        confirm = input(
            "⚠️ This will drop and recreate ALL tables. Are you sure? (yes/no): "
        )
        if confirm.lower() != 'yes':
            return False

        await reset_db(engine)
        logger.info("Database reset successfully")
        return True
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return False


async def main():
    parser = argparse.ArgumentParser(description="Database management utility")
    parser.add_argument(
        "command",
        choices=[
            "create-tables", "reset"
        ],
        help="Database management command to run"
    )

    args = parser.parse_args()

    try:
        if args.command == "create-tables":
            await create_tables()
        elif args.command == "reset":
            await reset_database()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))

    logger.info("Database Management Utility")

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("Operation cancelled by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)
