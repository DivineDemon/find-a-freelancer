"""Payment router for PayPal integration."""

from datetime import datetime, timezone
from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logger import get_logger
from app.models.payment import Payment
from app.models.user import User
from app.routers.auth_router import get_current_user
from app.schemas.payment_schema import (
    PaymentCaptureResponse,
    PaymentCreate,
    PaymentRead,
    PaymentStatus,
    PayPalOrderResponse,
    WebhookResponse,
)
from app.services.paypal_service import paypal_service

logger = get_logger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create-order", response_model=PayPalOrderResponse)
async def create_payment_order(
    payment_data: PaymentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Create a PayPal payment order."""
    # Only client hunters can create payments
    if current_user.user_type != "client_hunter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only client hunters can create payments"
        )
    
    # Check if user already has an active payment
    existing_payment = await session.execute(
        select(Payment).where(
            and_(
                Payment.user_id == current_user.id,
                Payment.status == PaymentStatus.COMPLETED
            )
        )
    )
    if existing_payment.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active payment"
        )
    
    try:
        # Create PayPal order
        paypal_order = await paypal_service.create_order(
            amount=float(payment_data.amount),
            currency=payment_data.currency,
            description=f"Platform Access Fee for {current_user.email}"
        )
        
        # Create payment record in database
        payment = Payment(
            user_id=current_user.id,
            amount=payment_data.amount,
            currency=payment_data.currency,
            payment_method="paypal",
            paypal_order_id=paypal_order["id"],
            status=PaymentStatus.PENDING,
            description=payment_data.description
        )
        
        session.add(payment)
        await session.commit()
        await session.refresh(payment)
        
        logger.info(
            f"Payment order created for user {current_user.id}: "
            f"{paypal_order['id']}"
        )
        
        return PayPalOrderResponse(
            payment_id=payment.id,
            paypal_order_id=paypal_order["id"],
            approval_url=paypal_order["links"][1]["href"],  # PayPal approval URL
            amount=payment_data.amount,
            currency=payment_data.currency
        )
        
    except Exception as e:
        logger.error(f"Failed to create payment order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        )


@router.post("/capture/{payment_id}", response_model=PaymentCaptureResponse)
async def capture_payment(
    payment_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Capture a PayPal payment after user approval."""
    # Get payment record
    payment_result = await session.execute(
        select(Payment).where(
            and_(
                Payment.id == payment_id,
                Payment.user_id == current_user.id
            )
        )
    )
    payment = payment_result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not in pending status"
        )
    
    try:
        # Capture PayPal order
        if not payment.paypal_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment has no PayPal order ID"
            )

        capture_data = await paypal_service.capture_order(payment.paypal_order_id)
        
        # Update payment status
        await session.execute(
            update(Payment).where(Payment.id == payment_id).values(
                status=PaymentStatus.COMPLETED,
                paypal_transaction_id=capture_data["purchase_units"][0]["payments"]["captures"][0]["id"],
                paid_at=datetime.now(timezone.utc).replace(tzinfo=None)
            )
        )
        
        # Update user payment status
        await session.execute(
            update(User).where(User.id == current_user.id).values(has_paid=True)
        )
        
        await session.commit()
        
        logger.info(f"Payment captured successfully: {payment_id}")
        
        return PaymentCaptureResponse(
            message="Payment captured successfully",
            payment_id=payment_id,
            status=PaymentStatus.COMPLETED
        )
        
    except Exception as e:
        logger.error(f"Failed to capture payment {payment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to capture payment"
        )


@router.get("/{payment_id}", response_model=PaymentRead)
async def get_payment(
    payment_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get payment details."""
    payment_result = await session.execute(
        select(Payment).where(
            and_(
                Payment.id == payment_id,
                Payment.user_id == current_user.id
            )
        )
    )
    payment = payment_result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return PaymentRead(**payment.__dict__)


@router.get("/user/payments", response_model=list[PaymentRead])
async def get_user_payments(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get all payments for the current user."""
    payments_result = await session.execute(
        select(Payment).where(
            Payment.user_id == current_user.id
        ).order_by(Payment.created_at.desc())
    )
    payments = payments_result.scalars().all()
    
    return [PaymentRead(**payment.__dict__) for payment in payments]


@router.post("/webhook/paypal", response_model=WebhookResponse)
async def paypal_webhook(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Handle PayPal webhook notifications."""
    try:
        webhook_body = await request.body()
        webhook_headers = dict(request.headers)
        
        # Verify webhook
        is_valid, webhook_data = await paypal_service.verify_webhook(
            webhook_body.decode(), 
            webhook_headers
        )
        
        if not is_valid or not webhook_data:
            logger.warning("Invalid PayPal webhook received")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook"
            )
        
        event_type = webhook_data.get("event_type")
        
        if not webhook_data:
            logger.warning("No webhook data received")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No webhook data"
            )

        if event_type == "CHECKOUT.ORDER.APPROVED":
            # Handle order approval
            await _handle_order_approval(webhook_data, session)
        elif event_type == "PAYMENT.CAPTURE.COMPLETED":
            # Handle payment completion
            await _handle_payment_completion(webhook_data, session)
        elif event_type == "PAYMENT.CAPTURE.DENIED":
            # Handle payment denial
            await _handle_payment_denial(webhook_data, session)
        else:
            logger.info(f"Unhandled webhook event: {event_type}")
        
        return WebhookResponse(status="success")
        
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


async def _handle_order_approval(webhook_data: Dict, session: AsyncSession):
    """Handle PayPal order approval webhook."""
    order_id = webhook_data["resource"]["id"]
    logger.info(f"PayPal order approved: {order_id}")
    
    # Update payment status to approved
    await session.execute(
        update(Payment).where(Payment.paypal_order_id ==
                              order_id).values(status=PaymentStatus.APPROVED)
    )
    await session.commit()


async def _handle_payment_completion(webhook_data: Dict, session: AsyncSession):
    """Handle PayPal payment completion webhook."""
    capture_id = webhook_data["resource"]["id"]
    order_id = webhook_data["resource"]["custom_id"]
    
    logger.info(f"PayPal payment completed: {capture_id}")
    
    # Update payment status to completed
    await session.execute(
        update(Payment).where(Payment.paypal_order_id == order_id).values(
            status=PaymentStatus.COMPLETED,
            paypal_transaction_id=capture_id,
            paid_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
    )
    
    # Update user payment status
    await session.execute(
        update(User).where(User.id == (
            select(Payment.user_id).where(Payment.paypal_order_id == order_id)
        )).values(has_paid=True)
    )
    
    await session.commit()


async def _handle_payment_denial(webhook_data: Dict, session: AsyncSession):
    """Handle PayPal payment denial webhook."""
    order_id = webhook_data["resource"]["custom_id"]
    
    logger.info(f"PayPal payment denied: {order_id}")
    
    # Update payment status to failed
    await session.execute(
        update(Payment).where(Payment.paypal_order_id ==
                              order_id).values(status=PaymentStatus.FAILED)
    )
    await session.commit()
