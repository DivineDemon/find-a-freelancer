from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ClientHunterBase(BaseModel):
    """Base client hunter schema."""
    first_name: str
    last_name: str
    country: str
    is_paid: bool
    payment_date: Optional[str] = None


class ClientHunterCreate(ClientHunterBase):
    """Schema for creating a new client hunter profile."""
    pass


class ClientHunterUpdate(BaseModel):
    """Schema for updating client hunter profile."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    is_paid: Optional[bool] = None
    payment_date: Optional[str] = None


class ClientHunterRead(ClientHunterBase):
    """Schema for reading client hunter profile."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
