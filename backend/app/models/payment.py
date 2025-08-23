import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.base import BaseModel


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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    payment_type = Column(Enum(PaymentType), nullable=False)
    
    # PayPal integration
    paypal_payment_id = Column(String, nullable=True, unique=True)
    paypal_order_id = Column(String, nullable=True, unique=True)
    paypal_transaction_id = Column(String, nullable=True, unique=True)
    
    # Payment status and metadata
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    description = Column(Text, nullable=True)
    
    # Timestamps
    paid_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="payments")
    
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
