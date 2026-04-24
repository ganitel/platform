"""
Ganitel V2 Backend - Orange Money Payment Client
"""

import httpx

from app.config import get_settings

settings = get_settings()


class OrangeMoneyClient:
    """Orange Money payment client"""

    @staticmethod
    async def get_token() -> str | None:
        """Get Orange Money API token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.ORANGE_MONEY_TOKEN_URL,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": settings.ORANGE_MONEY_CLIENT_ID,
                        "client_secret": settings.ORANGE_MONEY_CLIENT_SECRET,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("access_token")
        except Exception:
            return None

    @staticmethod
    async def initiate_payment(
        amount: float, phone_number: str, order_id: str, callback_url: str
    ) -> dict:
        """Initiate Orange Money payment"""
        token = await OrangeMoneyClient.get_token()
        if not token:
            raise Exception("Failed to get Orange Money token")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.ORANGE_MONEY_PAYMENT_URL,
                json={
                    "merchant_key": settings.ORANGE_MONEY_MERCHANT_KEY,
                    "currency": "XAF",
                    "order_id": order_id,
                    "amount": amount,
                    "return_url": callback_url,
                    "cancel_url": callback_url,
                    "notif_url": settings.ORANGE_MONEY_WEBHOOK_URL,
                    "lang": "fr",
                    "reference": "Ganitel Payment",
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
