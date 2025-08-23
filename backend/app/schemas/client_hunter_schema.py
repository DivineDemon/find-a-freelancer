from typing import Optional

from pydantic import BaseModel


class ClientHunterBase(BaseModel):
    """Base client hunter schema."""
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class ClientHunterCreate(ClientHunterBase):
    """Schema for creating a client hunter profile."""
    pass


class ClientHunterUpdate(BaseModel):
    """Schema for updating client hunter profile."""
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class ClientHunterRead(ClientHunterBase):
    """Schema for reading client hunter profile."""
    id: int
    user_id: int

    class Config:
        from_attributes = True
