import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import BaseModel
from app.models.user import User


class PaymentStatus(str, enum.Enum):
    """Enum for payment statuses."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentType(str, enum.Enum):
    """Enum for payment types."""
    ONE_TIME_FEE = "one_time_fee"
    SUBSCRIPTION = "subscription"
    PROJECT_PAYMENT = "project_payment"


class Payment(BaseModel):
    """Payment model for PayPal integration and financial transactions."""
    __tablename__ = "payments"
    
    # Payment details
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(
        String, default="USD", nullable=False)
    payment_type: Mapped[PaymentType] = mapped_column(
        Enum(PaymentType), nullable=False)
    
    # PayPal integration
    paypal_payment_id: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, unique=True)
    paypal_order_id: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, unique=True)
    paypal_transaction_id: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, unique=True)
    
    # Payment status and metadata
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", backref="payments")
    
    def __repr__(self):
        return (
            f"<Payment(id={self.id}, "
            f"user_id={self.user_id}, "
            f"amount={self.amount}, "
            f"status={self.status})>"
        )
    
    def mark_completed(self, paypal_payment_id: str, paypal_transaction_id: str):
        """Mark payment as completed with PayPal details."""
        self.status = PaymentStatus.COMPLETED
        self.paypal_payment_id = paypal_payment_id
        self.paypal_transaction_id = paypal_transaction_id
        self.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
