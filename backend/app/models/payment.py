from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import BaseModel


class Payment(BaseModel):
    __tablename__ = "payments"
    
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    stripe_payment_intent_id: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, index=True)
    amount: Mapped[int] = mapped_column(
        Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String, default="usd", nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    payment_method: Mapped[Optional[str]
                           ] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_metadata: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)
    failed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)
    canceled_at: Mapped[Optional[datetime]
                        ] = mapped_column(DateTime, nullable=True)
    refunded: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    refunded_at: Mapped[Optional[datetime]
                        ] = mapped_column(DateTime, nullable=True)
    refund_amount: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True)

    def __repr__(self):
        return (
            f"<Payment(id={self.id}, user_id={self.user_id}, "
            f"amount={self.amount}, status={self.status})>"
        )
