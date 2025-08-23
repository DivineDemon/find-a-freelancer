from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps to models."""
    created_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False
    )
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), 
        nullable=False
    )


class BaseModel(Base, TimestampMixin):
    """Base model with common fields and timestamps."""
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
