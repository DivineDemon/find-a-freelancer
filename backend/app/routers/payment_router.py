"""Payment router for Stripe integration."""

import json
from datetime import datetime, timezone
from typing import List

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.logger import get_logger
from app.models.client_hunter import ClientHunter
from app.models.payment import Payment
from app.models.user import User
from app.schemas.generic import UserJWT
from app.schemas.payment_schema import (
    ManualPaymentUpdateResponse,
    PaymentConfigResponse,
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentRead,
    PaymentStatusResponse,
    ReceiptUrlResponse,
    WebhookResponse,
)
from app.services.stripe_service import StripeService
from app.utils.auth_utils import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a Stripe payment intent."""
    try:
        # Create payment intent with Stripe
        payment_intent = StripeService.create_payment_intent(
            amount=payment_data.amount,
            currency=payment_data.currency,
            metadata={
                "user_id": str(current_user.sub),
                "description": payment_data.description or "Platform Access Fee"
            }
        )
        
        # Create payment record in database
        payment_record = Payment(
            user_id=int(current_user.sub),
            stripe_payment_intent_id=payment_intent["payment_intent_id"],
            amount=payment_data.amount,
            currency=payment_data.currency,
            status="pending",
            description=payment_data.description,
            payment_metadata=json.dumps(
                payment_data.metadata) if payment_data.metadata else None
        )
        
        session.add(payment_record)
        await session.commit()
        await session.refresh(payment_record)
        
        logger.info(
            f"Created payment intent for user {current_user.sub}: "
            f"{payment_intent['payment_intent_id']}"
        )
        
        return PaymentIntentResponse(
            client_secret=payment_intent["client_secret"],
            payment_intent_id=payment_intent["payment_intent_id"],
            amount=payment_intent["amount"],
            currency=payment_intent["currency"],
            status=payment_intent["status"]
        )
        
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment intent: {str(e)}"
        )


@router.get("/payment-intent/{payment_intent_id}", response_model=PaymentRead)
async def get_payment_intent(
    payment_intent_id: str,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get payment intent details."""
    try:
        # Get payment from database
        result = await session.execute(
            select(Payment).where(
                Payment.stripe_payment_intent_id == payment_intent_id,
                Payment.user_id == int(current_user.sub)
            )
        )
        payment = result.scalar_one_or_none()

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )

        return PaymentRead.model_validate(payment)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving payment intent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment intent"
        )


@router.get("/user-payments", response_model=List[PaymentRead])
async def get_user_payments(
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get all payments for the current user."""
    try:
        result = await session.execute(
            select(Payment).where(Payment.user_id == int(current_user.sub))
            .order_by(Payment.created_at.desc())
        )
        payments = result.scalars().all()

        return [
            PaymentRead.model_validate(payment) for payment in payments
        ]

    except Exception as e:
        logger.error(f"Error retrieving user payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payments"
        )


@router.post("/webhook", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events."""
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        logger.info(f"Webhook received - Headers: {dict(request.headers)}")
        logger.info(f"Webhook payload size: {len(payload)} bytes")

        if not sig_header:
            logger.error("Missing stripe-signature header in webhook request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )

        # Verify webhook signature
        event = StripeService.construct_webhook_event(payload, sig_header)
        logger.info(
            f"Webhook event verified: {event['type']} - {event.get('id', 'no-id')}"
        )

        # Handle different event types
        if event["type"] == "payment_intent.succeeded":
            logger.info("Processing payment_intent.succeeded event")
            await handle_payment_succeeded(event, session)
        elif event["type"] == "payment_intent.payment_failed":
            logger.info("Processing payment_intent.payment_failed event")
            await handle_payment_failed(event, session)
        elif event["type"] == "payment_intent.canceled":
            logger.info("Processing payment_intent.canceled event")
            await handle_payment_canceled(event, session)
        else:
            logger.info(f"Unhandled webhook event type: {event['type']}")

        logger.info(f"Successfully processed webhook event: {event['type']}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        import traceback
        logger.error(f"Webhook error traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook processing failed"
        )


async def handle_payment_succeeded(event: dict, session: AsyncSession):
    """Handle payment succeeded webhook."""
    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]

    logger.info(
        f"Processing payment succeeded webhook for payment intent: {payment_intent_id}"
    )
    logger.info(f"Payment intent data: {payment_intent}")
    payment_method_field = payment_intent.get('payment_method')
    logger.info(
        f"Payment method field: {payment_method_field} "
        f"(type: {type(payment_method_field)})"
    )

    # Update payment in database
    result = await session.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        logger.error(
            f"Payment not found in database for payment intent: {payment_intent_id}"
        )
        return

    logger.info(
        f"Found payment in database: {payment.id} for user: {payment.user_id}")

    payment.status = "succeeded"
    payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
    # Extract payment method type safely
    payment_method = payment_intent.get("payment_method")
    if isinstance(payment_method, dict):
        payment.payment_method = payment_method.get("type", "card")
    elif isinstance(payment_method, str):
        # If it's a string (payment method ID), default to card
        payment.payment_method = "card"
    else:
        payment.payment_method = "card"

    # Update user payment status
    user_result = await session.execute(
        select(User).where(User.id == payment.user_id)
    )
    user = user_result.scalar_one_or_none()

    if not user:
        logger.error(f"User not found for payment: {payment.user_id}")
        return

    # Update client hunter profile if user is a client hunter
    if user.user_type == "client_hunter":
        client_hunter_result = await session.execute(
            select(ClientHunter).where(ClientHunter.user_id == user.id)
        )
        client_hunter = client_hunter_result.scalar_one_or_none()
        if client_hunter:
            logger.info(
                f"Updating client hunter profile {client_hunter.id} "
                f"payment status for user {user.id} ({user.email})"
            )
            client_hunter.is_paid = True
            client_hunter.payment_date = datetime.now(
                timezone.utc).strftime("%Y-%m-%d")
        else:
            logger.error(
                f"Client hunter profile not found for user: {user.id}")
    else:
        logger.info(
            f"User {user.id} ({user.email}) is a freelancer - "
            f"no payment status to update"
        )

    await session.commit()
    logger.info(f"Payment succeeded and database updated: {payment_intent_id}")


async def handle_payment_failed(event: dict, session: AsyncSession):
    """Handle payment failed webhook."""
    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]

    # Update payment in database
    result = await session.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id)
    )
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = "failed"
        payment.failed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()
        logger.info(f"Payment failed: {payment_intent_id}")


async def handle_payment_canceled(event: dict, session: AsyncSession):
    """Handle payment canceled webhook."""
    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]

    # Update payment in database
    result = await session.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id)
    )
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = "canceled"
        payment.canceled_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()
        logger.info(f"Payment canceled: {payment_intent_id}")


@router.get("/receipt/{payment_id}", response_model=ReceiptUrlResponse)
async def get_receipt_url(
    payment_id: int,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get receipt URL from Stripe for a payment."""
    if payment_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment ID"
        )

    # Step 1: Get stripe_payment_intent_id from payments table
    result = await session.execute(
        select(Payment).where(
            Payment.id == payment_id,
            Payment.user_id == int(current_user.sub)
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    if payment.status != "succeeded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt is only available for successful payments"
        )

    stripe_payment_intent_id = payment.stripe_payment_intent_id
    logger.info(f"Step 1: Found payment intent ID: {stripe_payment_intent_id}")

    # Step 2: Retrieve payment intent from Stripe
    try:
        payment_intent = stripe.PaymentIntent.retrieve(
            stripe_payment_intent_id)
        logger.info(f"Step 2: Retrieved payment intent: {payment_intent.id}")
        logger.info(f"Step 2: Payment intent type: {type(payment_intent)}")
        logger.info(f"Step 2: Payment intent data: {payment_intent}")
    except stripe.StripeError as e:
        logger.error(f"Stripe error retrieving payment intent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve payment intent from Stripe"
        )

    # Step 3: Extract latest_charge from payment intent
    latest_charge_id = payment_intent.latest_charge
    logger.info(f"Step 3: Latest charge field: {latest_charge_id}")
    logger.info(f"Step 3: Latest charge field type: {type(latest_charge_id)}")

    if not latest_charge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No charge found for this payment intent"
        )

    logger.info(f"Step 3: Using charge ID: {latest_charge_id}")

    # Step 4: Retrieve charge details using charge_id
    try:
        logger.info(
            f"Step 4: Retrieving charge with ID: {latest_charge_id} "
            f"(type: {type(latest_charge_id)})")
        charge = stripe.Charge.retrieve(latest_charge_id)  # pyright: ignore[reportArgumentType]
        logger.info(f"Step 4: Retrieved charge: {charge.id}")
        logger.info(f"Step 4: Charge type: {type(charge)}")
        logger.info(f"Step 4: Charge data: {charge}")
    except stripe.StripeError as e:
        logger.error(f"Stripe error retrieving charge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve charge from Stripe"
        )

    # Step 5: Extract receipt_url from charge data
    receipt_url = charge.receipt_url
    logger.info(f"Step 5: Receipt URL: {receipt_url}")
    logger.info(f"Step 5: Receipt URL type: {type(receipt_url)}")

    if not receipt_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt URL not available from Stripe"
        )
    logger.info(f"Step 5: Successfully found receipt URL: {receipt_url}")

    return {"receipt_url": receipt_url}


@router.get("/config", response_model=PaymentConfigResponse)
async def get_payment_config():
    """Get payment configuration for frontend."""
    return PaymentConfigResponse(
        publishable_key=StripeService.get_publishable_key(),
        platform_fee_amount=5000,  # $50.00 in cents
        currency="usd"
    )


@router.post("/check-payment-status", response_model=PaymentStatusResponse)
async def check_payment_status(
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Check and update payment status for current user."""
    try:
        user_result = await session.execute(
            select(User).where(User.id == int(current_user.sub))
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # For freelancers, they don't need to pay
        if user.user_type == "freelancer":
            return PaymentStatusResponse(
                has_paid=True,  # Freelancers don't need to pay
                payment_status="paid"
            )

        # For client hunters, check their payment status
        if user.user_type == "client_hunter":
            client_hunter_result = await session.execute(
                select(ClientHunter).where(ClientHunter.user_id == user.id)
            )
            client_hunter = client_hunter_result.scalar_one_or_none()

            if not client_hunter:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client hunter profile not found"
                )

            # Check if user has any successful payments
            result = await session.execute(
                select(Payment).where(
                    Payment.user_id == int(current_user.sub),
                    Payment.status == "succeeded"
                )
            )
            successful_payment = result.scalar_one_or_none()

            # Update client hunter payment status if payment exists
            # but profile not updated
            if successful_payment and not client_hunter.is_paid:
                client_hunter.is_paid = True
                client_hunter.payment_date = (
                    successful_payment.paid_at.strftime("%Y-%m-%d")
                    if successful_payment.paid_at
                    else datetime.now(timezone.utc).replace(
                        tzinfo=None).strftime("%Y-%m-%d")
                )
                await session.commit()
                logger.info(
                    f"Updated payment status for client hunter {client_hunter.id}"
                )

            return PaymentStatusResponse(
                has_paid=client_hunter.is_paid,
                payment_status="paid" if client_hunter.is_paid else "unpaid"
            )

        # This should not happen, but just in case
        return PaymentStatusResponse(
            has_paid=False,
            payment_status="unpaid"
        )

    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check payment status"
        )


@router.post(
    "/manual-payment-update/{payment_intent_id}",
    response_model=ManualPaymentUpdateResponse
)
async def manual_payment_update(
    payment_intent_id: str,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Manually update payment status for testing purposes."""
    try:
        logger.info(
            f"Manual payment update requested for payment intent: {payment_intent_id}"
        )

        # Find the payment in database
        payment_result = await session.execute(
            select(Payment).where(
                Payment.stripe_payment_intent_id == payment_intent_id,
                Payment.user_id == int(current_user.sub)
            )
        )
        payment = payment_result.scalar_one_or_none()

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )

        logger.info(
            f"Found payment: {payment.id} with status: {payment.status}")

        # Get user
        user_result = await session.execute(
            select(User).where(User.id == int(current_user.sub))
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update payment status
        payment.status = "succeeded"
        payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
        payment.payment_method = "card"

        # Update client hunter profile if user is a client hunter
        if user.user_type == "client_hunter":
            client_hunter_result = await session.execute(
                select(ClientHunter).where(ClientHunter.user_id == user.id)
            )
            client_hunter = client_hunter_result.scalar_one_or_none()

            if client_hunter:
                logger.info(
                    f"Updating client hunter profile {client_hunter.id}")
                client_hunter.is_paid = True
                client_hunter.payment_date = datetime.now(
                    timezone.utc).strftime("%Y-%m-%d")
            else:
                logger.error(
                    f"Client hunter profile not found for user: {user.id}")

        await session.commit()
        logger.info(
            f"Manual payment update completed for payment intent: {payment_intent_id}"
        )

        return ManualPaymentUpdateResponse(
            status="success",
            message="Payment status updated manually"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in manual payment update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update payment status"
        )
