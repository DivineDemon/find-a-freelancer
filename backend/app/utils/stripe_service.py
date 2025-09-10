from typing import Any, Dict, Optional

import stripe

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:

    @staticmethod
    def create_payment_intent(
        amount: int, 
        currency: str = "usd", 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": intent.amount,
                "currency": intent.currency,
                "status": intent.status
            }
        except stripe.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            raise Exception(f"Payment creation failed: {str(e)}")

    @staticmethod
    def retrieve_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "id": intent.id,
                "amount": intent.amount,
                "currency": intent.currency,
                "status": intent.status,
                "metadata": intent.metadata,
                "client_secret": intent.client_secret
            }
        except stripe.StripeError as e:
            logger.error(
            f"Stripe error retrieving payment intent: {str(e)}"
        )
            raise Exception(f"Payment retrieval failed: {str(e)}")

    @staticmethod
    def confirm_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        
        try:
            intent = stripe.PaymentIntent.confirm(payment_intent_id)
            return {
                "id": intent.id,
                "amount": intent.amount,
                "currency": intent.currency,
                "status": intent.status,
                "metadata": intent.metadata
            }
        except stripe.StripeError as e:
            logger.error(f"Stripe error confirming payment intent: {str(e)}")
            raise Exception(f"Payment confirmation failed: {str(e)}")

    @staticmethod
    def create_customer(
        email: str, 
        name: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "metadata": customer.metadata
            }
        except stripe.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            raise Exception(f"Customer creation failed: {str(e)}")

    @staticmethod
    def construct_webhook_event(
        payload: bytes, sig_header: str
    ) -> Dict[str, Any]:
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            raise Exception("Invalid payload")
        except stripe.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            raise Exception("Invalid signature")

    @staticmethod
    def get_publishable_key() -> str:
        
        return settings.STRIPE_PUBLISHABLE_KEY

    @staticmethod
    def retrieve_payment_intent_with_receipt(payment_intent_id: str) -> Dict[str, Any]:
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "id": intent.id,
                "amount": intent.amount,
                "currency": intent.currency,
                "status": intent.status,
                "metadata": intent.metadata,
                "client_secret": intent.client_secret,
                "receipt_url": (
                    intent.charges.data[0].receipt_url # type: ignore
                    if intent.charges.data else None # type: ignore
                )
            }
        except stripe.StripeError as e:
            logger.error(f"Stripe error retrieving payment intent: {str(e)}")
            raise Exception(f"Payment retrieval failed: {str(e)}")

    @staticmethod
    def download_receipt_pdf(receipt_url: str) -> bytes:
        
        try:
            import requests
            response = requests.get(receipt_url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Error downloading receipt PDF: {str(e)}")
            raise Exception(f"Receipt download failed: {str(e)}")
