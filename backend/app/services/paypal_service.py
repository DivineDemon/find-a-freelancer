"""PayPal service for handling payments and webhooks."""

import json
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlencode

import requests
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class PayPalService:
    """PayPal service for payment processing."""
    
    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.mode = settings.PAYPAL_MODE
        self.base_url = (
            "https://api-m.sandbox.paypal.com" 
            if self.mode == "sandbox" 
            else "https://api-m.paypal.com"
        )
        self.access_token = None
    
    async def get_access_token(self) -> str:
        """Get PayPal access token."""
        if self.access_token:
            return self.access_token
        
        auth_url = f"{self.base_url}/v1/oauth2/token"
        auth_data = {
            "grant_type": "client_credentials"
        }
        auth_headers = {
            "Authorization": f"Basic {self._get_basic_auth()}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        try:
            response = requests.post(
                auth_url, 
                data=urlencode(auth_data), 
                headers=auth_headers
            )
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data["access_token"]
            logger.info("PayPal access token obtained successfully")
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service temporarily unavailable"
            )
    
    def _get_basic_auth(self) -> str:
        """Get basic authentication header value."""
        import base64
        credentials = f"{self.client_id}:{self.client_secret}"
        return base64.b64encode(credentials.encode()).decode()
    
    async def create_order(
        self, 
        amount: float, 
        currency: str = "USD",
        description: str = "Platform Access Fee"
    ) -> Dict:
        """Create a PayPal order."""
        if not self.client_id or not self.client_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="PayPal not configured"
            )
        
        access_token = await self.get_access_token()
        
        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": str(amount)
                    },
                    "description": description,
                    "custom_id": f"platform_fee_{amount}_{currency}"
                }
            ],
            "application_context": {
                "return_url": f"{settings.CORS_ORIGINS[0]}/payment/success",
                "cancel_url": f"{settings.CORS_ORIGINS[0]}/payment/cancel",
                "brand_name": "Find a Freelancer",
                "landing_page": "LOGIN",
                "user_action": "PAY_NOW"
            }
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/v2/checkout/orders",
                json=order_data,
                headers=headers
            )
            response.raise_for_status()
            
            order = response.json()
            logger.info(f"PayPal order created: {order['id']}")
            return order
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create PayPal order: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to create payment order"
            )
    
    async def capture_order(self, order_id: str) -> Dict:
        """Capture a PayPal order payment."""
        access_token = await self.get_access_token()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                headers=headers
            )
            response.raise_for_status()
            
            capture_data = response.json()
            logger.info(f"PayPal order captured: {order_id}")
            return capture_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to capture PayPal order {order_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to capture payment"
            )
    
    async def get_order_details(self, order_id: str) -> Dict:
        """Get details of a PayPal order."""
        access_token = await self.get_access_token()
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/v2/checkout/orders/{order_id}",
                headers=headers
            )
            response.raise_for_status()
            
            order = response.json()
            return order
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get PayPal order {order_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to get order details"
            )
    
    async def verify_webhook(
        self, 
        webhook_body: str, 
        webhook_headers: Dict
    ) -> Tuple[bool, Optional[Dict]]:
        """Verify PayPal webhook signature."""
        # In production, implement proper webhook signature verification
        # For now, we'll do basic validation
        
        try:
            webhook_data = json.loads(webhook_body)
            event_type = webhook_data.get("event_type")
            
            if not event_type:
                logger.warning("Webhook missing event_type")
                return False, None
            
            # Log webhook for debugging
            logger.info(f"PayPal webhook received: {event_type}")
            
            return True, webhook_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid webhook JSON: {e}")
            return False, None
    
    async def refund_payment(
        self, 
        capture_id: str, 
        amount: Optional[float] = None,
        reason: str = "Platform refund"
    ) -> Dict:
        """Refund a PayPal payment."""
        access_token = await self.get_access_token()
        
        refund_data: Dict[str, Any] = {
            "reason": reason
        }
        
        if amount:
            refund_data["amount"] = {
                "value": str(amount),
                "currency_code": "USD"
            }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/v2/payments/captures/{capture_id}/refund",
                json=refund_data,
                headers=headers
            )
            response.raise_for_status()
            
            refund = response.json()
            logger.info(f"PayPal refund processed: {capture_id}")
            return refund
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to refund PayPal payment {capture_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to process refund"
            )


# Global PayPal service instance
paypal_service = PayPalService()
