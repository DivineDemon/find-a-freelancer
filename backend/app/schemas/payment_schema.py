from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PaymentIntentCreate(BaseModel):
    
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(default="usd", description="Currency code")
    description: Optional[str] = Field(None, description="Payment description")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata")

class PaymentIntentResponse(BaseModel):
    
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str
    status: str

class PaymentRead(BaseModel):
    
    id: int
    user_id: int
    stripe_payment_intent_id: str
    stripe_customer_id: Optional[str] = None
    amount: int
    currency: str
    status: str
    payment_method: Optional[str] = None
    description: Optional[str] = None
    payment_metadata: Optional[str] = None
    paid_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    refunded: bool = False
    refunded_at: Optional[datetime] = None
    refund_amount: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    
    user_id: int
    stripe_payment_intent_id: str
    stripe_customer_id: Optional[str] = None
    amount: int
    currency: str = "usd"
    status: str
    payment_method: Optional[str] = None
    description: Optional[str] = None
    payment_metadata: Optional[str] = None

class PaymentUpdate(BaseModel):
    
    status: Optional[str] = None
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    refunded: Optional[bool] = None
    refunded_at: Optional[datetime] = None
    refund_amount: Optional[int] = None

class WebhookEvent(BaseModel):
    
    id: str
    type: str
    data: Dict[str, Any]
    created: int

class WebhookResponse(BaseModel):
    
    status: str

class PaymentConfigResponse(BaseModel):
    
    publishable_key: str
    platform_fee_amount: int
    currency: str

class PaymentStatusResponse(BaseModel):
    
    has_paid: bool
    payment_status: str

class ManualPaymentUpdateResponse(BaseModel):
    
    status: str
    message: str

class ReceiptUrlResponse(BaseModel):
    
    receipt_url: str
