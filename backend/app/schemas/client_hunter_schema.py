from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ClientHunterBase(BaseModel):
    
    first_name: str
    last_name: str
    country: str
    is_paid: bool
    payment_date: Optional[str] = None

class ClientHunterCreate(ClientHunterBase):
    
    pass

class ClientHunterUpdate(BaseModel):
    
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    is_paid: Optional[bool] = None
    payment_date: Optional[str] = None

class ClientHunterRead(ClientHunterBase):
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
