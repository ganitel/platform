"""
Ganitel V2 Backend - Mobile Money Payment Client
"""
import httpx
from typing import Dict, Optional
from app.config import get_settings

settings = get_settings()


class MobileMoneyClient:
    """Mobile Money payment client (MTN, etc.)"""
    
    @staticmethod
    async def get_token() -> Optional[str]:
        """Get Mobile Money API token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.MOBILE_MONEY_TOKEN_URL,
                    headers={
                        "Authorization": f"Basic {settings.MOBILE_MONEY_BASIC_AUTH}",
                        "Content-Type": "application/json"
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get("access_token")
        except Exception:
            return None
    
    @staticmethod
    async def initiate_payment(
        amount: float,
        phone_number: str,
        external_id: str,
        callback_url: str
    ) -> Dict:
        """Initiate Mobile Money payment"""
        token = await MobileMoneyClient.get_token()
        if not token:
            raise Exception("Failed to get Mobile Money token")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.MOBILE_MONEY_PAYMENT_URL,
                json={
                    "amount": str(amount),
                    "currency": "XAF",
                    "externalId": external_id,
                    "payer": {
                        "partyIdType": "MSISDN",
                        "partyId": phone_number
                    },
                    "payerMessage": "Payment for Ganitel booking",
                    "payeeNote": "Ganitel"
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Target-Environment": settings.MOBILE_MONEY_ENVIRONMENT,
                    "X-Callback-Url": callback_url,
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()

