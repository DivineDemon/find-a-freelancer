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
from app.utils.auth_utils import get_current_user
from app.utils.stripe_service import StripeService

logger = get_logger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    try:
        payment_intent = StripeService.create_payment_intent(
            amount=payment_data.amount,
            currency=payment_data.currency,
            metadata={
                "user_id": str(current_user.sub),
                "description": payment_data.description or "Platform Access Fee"
            }
        )

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

    try:

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

    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")


        if not sig_header:
            logger.error("Missing stripe-signature header in webhook request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )

        event = StripeService.construct_webhook_event(payload, sig_header)

        if event["type"] == "payment_intent.succeeded":
            await handle_payment_succeeded(event, session)
        elif event["type"] == "payment_intent.payment_failed":
            await handle_payment_failed(event, session)
        elif event["type"] == "payment_intent.canceled":
            await handle_payment_canceled(event, session)
        else:
            logger.info(f"Unhandled webhook event type: {event['type']}")

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

    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]


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


    payment.status = "succeeded"
    payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)

    payment_method = payment_intent.get("payment_method")
    if isinstance(payment_method, dict):
        payment.payment_method = payment_method.get("type", "card")
    elif isinstance(payment_method, str):

        payment.payment_method = "card"
    else:
        payment.payment_method = "card"

    user_result = await session.execute(
        select(User).where(User.id == payment.user_id)
    )
    user = user_result.scalar_one_or_none()

    if not user:
        logger.error(f"User not found for payment: {payment.user_id}")
        return

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
    await session.commit()

async def handle_payment_failed(event: dict, session: AsyncSession):

    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]

    result = await session.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id)
    )
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = "failed"
        payment.failed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()

async def handle_payment_canceled(event: dict, session: AsyncSession):

    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]

    result = await session.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id)
    )
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = "canceled"
        payment.canceled_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()

@router.get("/receipt/{payment_id}", response_model=ReceiptUrlResponse)
async def get_receipt_url(
    payment_id: int,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):

    if payment_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment ID"
        )

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

    try:
        payment_intent = stripe.PaymentIntent.retrieve(
            stripe_payment_intent_id)
    except stripe.StripeError as e:
        logger.error(f"Stripe error retrieving payment intent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve payment intent from Stripe"
        )

    latest_charge_id = payment_intent.latest_charge

    if not latest_charge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No charge found for this payment intent"
        )


    try:
        charge = stripe.Charge.retrieve(latest_charge_id) # type: ignore
    except stripe.StripeError as e:
        logger.error(f"Stripe error retrieving charge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve charge from Stripe"
        )

    receipt_url = charge.receipt_url

    if not receipt_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt URL not available from Stripe"
        )

    return {"receipt_url": receipt_url}

@router.get("/config", response_model=PaymentConfigResponse)
async def get_payment_config():

    return PaymentConfigResponse(
        publishable_key=StripeService.get_publishable_key(),
        platform_fee_amount=5000,
        currency="usd"
    )

@router.post("/check-payment-status", response_model=PaymentStatusResponse)
async def check_payment_status(
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):

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

        if user.user_type == "freelancer":
            return PaymentStatusResponse(
                has_paid=True,
                payment_status="paid"
            )

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

            result = await session.execute(
                select(Payment).where(
                    Payment.user_id == int(current_user.sub),
                    Payment.status == "succeeded"
                )
            )
            successful_payment = result.scalar_one_or_none()

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

    try:

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


        user_result = await session.execute(
            select(User).where(User.id == int(current_user.sub))
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        payment.status = "succeeded"
        payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
        payment.payment_method = "card"

        if user.user_type == "client_hunter":
            client_hunter_result = await session.execute(
                select(ClientHunter).where(ClientHunter.user_id == user.id)
            )
            client_hunter = client_hunter_result.scalar_one_or_none()

            if client_hunter:
                client_hunter.is_paid = True
                client_hunter.payment_date = datetime.now(
                    timezone.utc).strftime("%Y-%m-%d")
            else:
                logger.error(
                    f"Client hunter profile not found for user: {user.id}")

        await session.commit()

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
