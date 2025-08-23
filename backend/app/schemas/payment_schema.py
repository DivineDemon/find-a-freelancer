"""Payment schemas for PayPal integration."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    """Payment method enumeration."""
    PAYPAL = "paypal"
    STRIPE = "stripe"
    BANK_TRANSFER = "bank_transfer"


class PaymentCreate(BaseModel):
    """Schema for creating a payment."""
    amount: Decimal = Field(..., ge=0.01, description="Payment amount")
    currency: str = Field(default="USD", description="Payment currency")
    description: str = Field(..., max_length=500, description="Payment description")
    payment_method: PaymentMethod = Field(default=PaymentMethod.PAYPAL)


class PaymentRead(BaseModel):
    """Schema for reading payment information."""
    id: int
    user_id: int
    amount: Decimal
    currency: str
    payment_method: PaymentMethod
    status: PaymentStatus
    description: str
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PayPalOrderResponse(BaseModel):
    """Schema for PayPal order creation response."""
    payment_id: int
    paypal_order_id: str
    approval_url: str
    amount: Decimal
    currency: str


class PaymentUpdate(BaseModel):
    """Schema for updating payment information."""
    status: Optional[PaymentStatus] = None
    description: Optional[str] = Field(None, max_length=500)
    paypal_capture_id: Optional[str] = None


class PaymentFilter(BaseModel):
    """Schema for filtering payments."""
    status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    min_amount: Optional[Decimal] = Field(None, ge=0)
    max_amount: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class PaymentSummary(BaseModel):
    """Schema for payment summary statistics."""
    total_payments: int
    total_amount: Decimal
    completed_payments: int
    completed_amount: Decimal
    pending_payments: int
    failed_payments: int
    currency: str = "USD"


class RefundRequest(BaseModel):
    """Schema for payment refund request."""
    reason: str = Field(..., max_length=500, description="Refund reason")
    amount: Optional[Decimal] = Field(None, ge=0.01, description="Refund amount (full if not specified)")


class WebhookEvent(BaseModel):
    """Schema for PayPal webhook events."""
    event_type: str
    resource_type: str
    resource: dict
    event_time: str
    id: str


class PaymentCaptureResponse(BaseModel):
    """Schema for payment capture response."""
    message: str
    payment_id: int
    status: PaymentStatus


class WebhookResponse(BaseModel):
    """Schema for webhook response."""
    status: str
