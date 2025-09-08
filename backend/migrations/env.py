import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Add the backend directory to the Python path before importing app modules
sys_path = str(Path(__file__).parent.parent)
if sys_path not in sys.path:
    sys.path.insert(0, sys_path)

# Import your models and database configuration
# These imports are needed for Alembic to detect the models
# noqa: E402 - These imports must come after sys.path manipulation
from app.core.base import Base  # noqa: F401, E402
from app.core.config import settings  # noqa: F401, E402
from app.models.chat import Chat  # noqa: F401, E402
from app.models.client_hunter import ClientHunter  # noqa: F401, E402
from app.models.freelancer import Freelancer  # noqa: F401, E402
from app.models.message import Message  # noqa: F401, E402
from app.models.project import Project  # noqa: F401, E402
from app.models.user import User  # noqa: F401, E402

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url():
    """Get database URL from environment variables."""
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Override the URL from config with environment variable
    url = get_url()
    
    # Create async engine for async database operations
    connectable = create_async_engine(url)
    
    async def do_run_migrations():
        async with connectable.begin() as connection:
            await connection.run_sync(do_migrations_sync)
    
    def do_migrations_sync(connection):
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        
        with context.begin_transaction():
            context.run_migrations()
    
    # Run migrations in async context
    asyncio.run(do_run_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
