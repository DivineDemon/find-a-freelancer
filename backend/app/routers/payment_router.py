"""Payment router for Stripe integration."""

import io
import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logger import get_logger
from app.models.payment import Payment
from app.schemas.generic import UserJWT
from app.schemas.payment_schema import (
    PaymentConfigResponse,
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentRead,
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
    session: AsyncSession = Depends(get_session)
):
    """Create a Stripe payment intent."""
    try:
        # Create payment intent with Stripe
        payment_intent = StripeService.create_payment_intent(
            amount=payment_data.amount,
            currency=payment_data.currency,
            metadata={
                "user_id": str(current_user.user_id),
                "description": payment_data.description or "Platform Access Fee"
            }
        )
        
        # Create payment record in database
        payment_record = Payment(
            user_id=current_user.user_id,
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
            f"Created payment intent for user {current_user.user_id}: "
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
    session: AsyncSession = Depends(get_session)
):
    """Get payment intent details."""
    try:
        # Get payment from database
        result = await session.execute(
            select(Payment).where(
                Payment.stripe_payment_intent_id == payment_intent_id,
                Payment.user_id == current_user.user_id
            )
        )
        payment = result.scalar_one_or_none()

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )

        return PaymentRead.from_orm(payment)

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
    session: AsyncSession = Depends(get_session)
):
    """Get all payments for the current user."""
    try:
        result = await session.execute(
            select(Payment).where(Payment.user_id == current_user.user_id)
            .order_by(Payment.created_at.desc())
        )
        payments = result.scalars().all()

        return [
            PaymentRead.from_orm(payment) for payment in payments
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
    session: AsyncSession = Depends(get_session)
):
    """Handle Stripe webhook events."""
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )

        # Verify webhook signature
        event = StripeService.construct_webhook_event(payload, sig_header)

        # Handle different event types
        if event["type"] == "payment_intent.succeeded":
            await handle_payment_succeeded(event, session)
        elif event["type"] == "payment_intent.payment_failed":
            await handle_payment_failed(event, session)
        elif event["type"] == "payment_intent.canceled":
            await handle_payment_canceled(event, session)

        logger.info(f"Processed webhook event: {event['type']}")
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook processing failed"
        )


async def handle_payment_succeeded(event: dict, session: AsyncSession):
    """Handle payment succeeded webhook."""
    payment_intent = event["data"]["object"]
    payment_intent_id = payment_intent["id"]

    # Update payment in database
    result = await session.execute(
        select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id)
    )
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = "succeeded"
        payment.paid_at = datetime.utcnow()
        payment.payment_method = payment_intent.get(
            "payment_method", {}).get("type")

        # Update user payment status
        from app.models.user import User
        user_result = await session.execute(
            select(User).where(User.id == payment.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.has_paid = True

        await session.commit()
        logger.info(f"Payment succeeded: {payment_intent_id}")


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
        payment.failed_at = datetime.utcnow()
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
        payment.canceled_at = datetime.utcnow()
        await session.commit()
        logger.info(f"Payment canceled: {payment_intent_id}")


@router.get("/invoice/{payment_id}", response_class=StreamingResponse)
async def download_invoice(
    payment_id: int,
    current_user: UserJWT = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Download payment invoice as PDF."""
    try:
        # Get payment details
        result = await session.execute(
            select(Payment).where(
                Payment.id == payment_id,
                Payment.user_id == current_user.user_id
            )
        )
        payment = result.scalar_one_or_none()

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )

        # Get user details
        from app.models.user import User
        user_result = await session.execute(
            select(User).where(User.id == current_user.user_id)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Generate PDF invoice
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        # Create custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12
        )

        # Build PDF content
        story = []

        # Title
        story.append(Paragraph("INVOICE", title_style))
        story.append(Spacer(1, 20))
        
        # Invoice details
        story.append(Paragraph("Invoice Details", heading_style))
        invoice_data = [
            ['Invoice Number:', f"INV-{payment.id:06d}"],
            ['Date:', payment.created_at.strftime("%B %d, %Y")],
            ['Payment ID:', payment.stripe_payment_intent_id],
            ['Status:', payment.status.upper()],
        ]
        
        if payment.paid_at:
            invoice_data.append(
                ['Paid Date:', payment.paid_at.strftime("%B %d, %Y")])
        
        invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(invoice_table)
        story.append(Spacer(1, 20))

        # Customer details
        story.append(Paragraph("Bill To", heading_style))
        customer_data = [
            ['Name:', f"{user.first_name} {user.last_name}"],
            ['Email:', user.email],
        ]
        
        if user.phone:
            customer_data.append(['Phone:', user.phone])
        
        customer_table = Table(customer_data, colWidths=[2*inch, 3*inch])
        customer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(customer_table)
        story.append(Spacer(1, 20))

        # Payment details
        story.append(Paragraph("Payment Details", heading_style))
        payment_data = [
            ['Description', 'Amount'],
            [payment.description or 'Platform Access Fee',
                f"${payment.amount / 100:.2f}"],
            ['', ''],
            ['Total', f"${payment.amount / 100:.2f}"]
        ]

        payment_table = Table(payment_data, colWidths=[4*inch, 1*inch])
        payment_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
            ('LINEBELOW', (0, -2), (-1, -2), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))

        story.append(payment_table)
        story.append(Spacer(1, 30))

        # Footer
        story.append(Paragraph(
            "Thank you for your business!<br/>"
            "This invoice was generated automatically by Find a Freelancer.",
            styles['Normal']
        ))

        # Build PDF
        doc.build(story)
        buffer.seek(0)

        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{payment.id}.pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate invoice"
        )


@router.get("/config", response_model=PaymentConfigResponse)
async def get_payment_config():
    """Get payment configuration for frontend."""
    return PaymentConfigResponse(
        publishable_key=StripeService.get_publishable_key(),
        platform_fee_amount=5000,  # $50.00 in cents
        currency="usd"
    )
