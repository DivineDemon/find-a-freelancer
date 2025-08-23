"""Payment router for PayPal integration."""

from typing import Annotated, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logger import get_logger
from app.models.payment import Payment
from app.models.user import User
from app.routers.auth_router import get_current_user
from app.services.paypal_service import paypal_service
from app.schemas.payment_schema import (
    PaymentCreate,
    PaymentRead,
    PaymentStatus,
    PayPalOrderResponse,
    PaymentCaptureResponse,
    WebhookResponse
)

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
        "SELECT * FROM payments WHERE user_id = :user_id AND status = 'completed'"
    )
    if existing_payment.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active payment"
        )
    
    try:
        # Create PayPal order
        paypal_order = await paypal_service.create_order(
            amount=payment_data.amount,
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
        
        logger.info(f"Payment order created for user {current_user.id}: {paypal_order['id']}")
        
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
        "SELECT * FROM payments WHERE id = :payment_id AND user_id = :user_id"
    )
    payment = payment_result.fetchone()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment["status"] != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not in pending status"
        )
    
    try:
        # Capture PayPal order
        capture_data = await paypal_service.capture_order(payment["paypal_order_id"])
        
        # Update payment status
        await session.execute(
            """
            UPDATE payments 
            SET status = :status, 
                paypal_capture_id = :capture_id,
                completed_at = NOW()
            WHERE id = :payment_id
            """,
            {
                "status": PaymentStatus.COMPLETED,
                "capture_id": capture_data["purchase_units"][0]["payments"]["captures"][0]["id"],
                "payment_id": payment_id
            }
        )
        
        # Update user payment status
        await session.execute(
            "UPDATE users SET has_paid = true WHERE id = :user_id",
            {"user_id": current_user.id}
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
        "SELECT * FROM payments WHERE id = :payment_id AND user_id = :user_id"
    )
    payment = payment_result.fetchone()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return PaymentRead(**payment)


@router.get("/user/payments", response_model=list[PaymentRead])
async def get_user_payments(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get all payments for the current user."""
    payments_result = await session.execute(
        "SELECT * FROM payments WHERE user_id = :user_id ORDER BY created_at DESC"
    )
    payments = payments_result.fetchall()
    
    return [PaymentRead(**payment) for payment in payments]


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
        
        if not is_valid:
            logger.warning("Invalid PayPal webhook received")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook"
            )
        
        event_type = webhook_data.get("event_type")
        
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
        """
        UPDATE payments 
        SET status = :status 
        WHERE paypal_order_id = :order_id
        """,
        {"status": PaymentStatus.APPROVED, "order_id": order_id}
    )
    await session.commit()


async def _handle_payment_completion(webhook_data: Dict, session: AsyncSession):
    """Handle PayPal payment completion webhook."""
    capture_id = webhook_data["resource"]["id"]
    order_id = webhook_data["resource"]["custom_id"]
    
    logger.info(f"PayPal payment completed: {capture_id}")
    
    # Update payment status to completed
    await session.execute(
        """
        UPDATE payments 
        SET status = :status, 
            paypal_capture_id = :capture_id,
            completed_at = NOW()
        WHERE paypal_order_id = :order_id
        """,
        {
            "status": PaymentStatus.COMPLETED,
            "capture_id": capture_id,
            "order_id": order_id
        }
    )
    
    # Update user payment status
    await session.execute(
        """
        UPDATE users 
        SET has_paid = true 
        WHERE id = (
            SELECT user_id FROM payments WHERE paypal_order_id = :order_id
        )
        """,
        {"order_id": order_id}
    )
    
    await session.commit()


async def _handle_payment_denial(webhook_data: Dict, session: AsyncSession):
    """Handle PayPal payment denial webhook."""
    order_id = webhook_data["resource"]["custom_id"]
    
    logger.info(f"PayPal payment denied: {order_id}")
    
    # Update payment status to failed
    await session.execute(
        """
        UPDATE payments 
        SET status = :status 
        WHERE paypal_order_id = :order_id
        """,
        {"status": PaymentStatus.FAILED, "order_id": order_id}
    )
    await session.commit()
