"""
Ganitel V2 Backend - Tranzak Payment Gateway Client
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class TranzakClient:
    """
    Client for Tranzak payment gateway integration
    Documentation: https://developers.tranzak.me
    """

    def __init__(
        self,
        api_key: str,
        app_id: str,
        app_key: str | None = None,
        base_url: str = "https://dsapi.tranzak.me/xp021/v1",
        auth_base_url: str | None = None,
    ):
        self.api_key = api_key
        self.app_id = app_id
        self.app_key = app_key or api_key
        self.api_base_url = self._normalize_api_base_url(base_url)
        self.auth_base_url = auth_base_url or self._derive_auth_base_url(
            self.api_base_url
        )
        self.timeout = 30.0
        self._token: str | None = None
        self._token_expires_at: datetime | None = None
        self._token_lock = asyncio.Lock()

    @staticmethod
    def _normalize_api_base_url(base_url: str) -> str:
        base_url = base_url.rstrip("/")
        if base_url.endswith("/xp021/v1"):
            return base_url
        return f"{base_url}/xp021/v1"

    @staticmethod
    def _derive_auth_base_url(api_base_url: str) -> str:
        api_base_url = api_base_url.rstrip("/")
        if api_base_url.endswith("/xp021/v1"):
            return api_base_url[: -len("/xp021/v1")]
        return api_base_url

    async def _get_token(self) -> str:
        now = datetime.utcnow()
        if self._token and self._token_expires_at and now < self._token_expires_at:
            return self._token

        async with self._token_lock:
            now = datetime.utcnow()
            if self._token and self._token_expires_at and now < self._token_expires_at:
                return self._token

            if not self.app_key:
                raise ValueError("Tranzak appKey is required to obtain a token")

            payload = {"appId": self.app_id, "appKey": self.app_key}

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.auth_base_url}/auth/token",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                )

                response.raise_for_status()
                data = response.json()

            if not data.get("success"):
                error_msg = data.get("errorMsg") or "Token request failed"
                raise ValueError(error_msg)

            token_data = data.get("data") or {}
            token = token_data.get("token")
            expires_in = token_data.get("expiresIn")

            if not token or not expires_in:
                raise ValueError("Token response missing token or expiry")

            self._token = token
            expiry_buffer = max(int(expires_in) - 60, 0)
            self._token_expires_at = now + timedelta(seconds=expiry_buffer)
            return token

    async def _get_headers(self) -> dict[str, str]:
        """Get request headers with authentication"""
        token = await self._get_token()
        return {
            "Authorization": f"Bearer {token}",
            "X-App-ID": self.app_id,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def initiate_payment(
        self,
        amount: float,
        currency: str,
        description: str,
        customer_email: str,
        customer_phone: str,
        customer_name: str,
        reference: str,
        callback_url: str,
        return_url: str,
    ) -> dict[str, Any]:
        """
        Initiate a payment transaction

        Args:
            amount: Payment amount
            currency: Currency code (XAF, USD, EUR)
            description: Payment description
            customer_email: Customer email
            customer_phone: Customer phone number
            customer_name: Customer full name
            reference: Unique payment reference (booking_id)
            callback_url: Webhook URL for payment status updates
            return_url: URL to redirect customer after payment

        Returns:
            Dict containing payment initiation response
        """
        try:
            payload = {
                "amount": amount,
                "currencyCode": currency,
                "description": description,
                "mchTransactionRef": reference,
                "callbackUrl": callback_url,
                "returnUrl": return_url,
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_base_url}/request/create",
                    json=payload,
                    headers=await self._get_headers(),
                )

                response.raise_for_status()
                data = response.json()

                if not data.get("success"):
                    error_msg = data.get("errorMsg") or "Payment initiation failed"
                    return {"success": False, "error": error_msg}

                payload_data = data.get("data") or {}
                logger.info(f"Payment initiated successfully: {reference}")
                return {
                    "success": True,
                    "transaction_id": payload_data.get("requestId")
                    or payload_data.get("request_id"),
                    "payment_url": payload_data.get("links", {}).get("paymentAuthUrl")
                    or payload_data.get("links", {}).get("payment_url"),
                    "data": payload_data,
                }

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Tranzak API error: {e.response.status_code} - {e.response.text}"
            )
            return {
                "success": False,
                "error": f"Payment initiation failed: {e.response.text}",
            }
        except Exception as e:
            logger.error(f"Tranzak client error: {e!s}")
            return {"success": False, "error": f"Payment initiation failed: {e!s}"}

    async def verify_payment(self, transaction_id: str) -> dict[str, Any]:
        """
        Verify payment status

        Args:
            transaction_id: Tranzak transaction ID

        Returns:
            Dict containing payment status
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.api_base_url}/request/details",
                    params={"requestId": transaction_id},
                    headers=await self._get_headers(),
                )

                response.raise_for_status()
                data = response.json()

                if not data.get("success"):
                    error_msg = data.get("errorMsg") or "Payment verification failed"
                    return {"success": False, "error": error_msg}

                payload_data = data.get("data") or {}
                return {
                    "success": True,
                    "status": payload_data.get("status"),
                    "data": payload_data,
                }

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Tranzak verify error: {e.response.status_code} - {e.response.text}"
            )
            return {
                "success": False,
                "error": f"Payment verification failed: {e.response.text}",
            }
        except Exception as e:
            logger.error(f"Tranzak verify error: {e!s}")
            return {"success": False, "error": f"Payment verification failed: {e!s}"}

    async def cancel_request(self, transaction_id: str) -> dict[str, Any]:
        """Cancel a pending payment request"""
        try:
            payload = {"requestId": transaction_id}

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_base_url}/request/cancel",
                    json=payload,
                    headers=await self._get_headers(),
                )

                response.raise_for_status()
                data = response.json()

                if not data.get("success"):
                    error_msg = data.get("errorMsg") or "Cancel request failed"
                    return {"success": False, "error": error_msg}

                return {"success": True, "data": data.get("data")}

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Tranzak cancel error: {e.response.status_code} - {e.response.text}"
            )
            return {"success": False, "error": f"Cancel failed: {e.response.text}"}
        except Exception as e:
            logger.error(f"Tranzak cancel error: {e!s}")
            return {"success": False, "error": f"Cancel failed: {e!s}"}

    async def void_request(self, transaction_id: str) -> dict[str, Any]:
        """Void a payment request (refund if already paid)"""
        try:
            payload = {"requestId": transaction_id}

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_base_url}/request/void",
                    json=payload,
                    headers=await self._get_headers(),
                )

                response.raise_for_status()
                data = response.json()

                if not data.get("success"):
                    error_msg = data.get("errorMsg") or "Void request failed"
                    return {"success": False, "error": error_msg}

                return {"success": True, "data": data.get("data")}

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Tranzak void error: {e.response.status_code} - {e.response.text}"
            )
            return {"success": False, "error": f"Void failed: {e.response.text}"}
        except Exception as e:
            logger.error(f"Tranzak void error: {e!s}")
            return {"success": False, "error": f"Void failed: {e!s}"}

    async def process_refund(
        self, transaction_id: str, amount: float, reason: str
    ) -> dict[str, Any]:
        """Process a refund - use void for completed payments, cancel for pending"""
        # First verify payment status to determine correct action
        verification = await self.verify_payment(transaction_id)

        if not verification.get("success"):
            return {
                "success": False,
                "error": f"Could not verify payment status: {verification.get('error', 'Unknown error')}",
            }

        payment_status = verification.get("status", "").upper()

        # If payment was completed, use void (triggers refund)
        if payment_status in ["SUCCESSFUL", "COMPLETED"]:
            logger.info(
                f"Processing refund via void for completed payment: {transaction_id}"
            )
            return await self.void_request(transaction_id)
        else:
            # If payment was pending/unpaid, use cancel
            logger.info(
                f"Processing refund via cancel for pending payment: {transaction_id}"
            )
            return await self.cancel_request(transaction_id)


def get_tranzak_client() -> TranzakClient:
    """Get Tranzak client instance"""
    from app.config import get_settings

    settings = get_settings()

    return TranzakClient(
        api_key=settings.TRANZAK_API_KEY,
        app_id=settings.TRANZAK_APP_ID,
        app_key=getattr(settings, "TRANZAK_APP_KEY", None),
        base_url=settings.TRANZAK_BASE_URL,
        auth_base_url=getattr(settings, "TRANZAK_AUTH_BASE_URL", None),
    )
