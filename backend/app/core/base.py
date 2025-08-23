from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all models using SQLAlchemy 2.0 declarative base."""
    pass


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps to models."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), 
        nullable=False
    )


class BaseModel(Base, TimestampMixin):
    """Base model with common fields and timestamps."""
    __abstract__ = True

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True)
