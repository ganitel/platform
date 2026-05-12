"""Africa's Talking SMS client — outbound only."""

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import AuthError


async def send_sms(*, to: str, message: str) -> dict[str, Any]:
    """Send a single SMS via Africa's Talking. Raises AuthError on failure.

    `to` must be E.164 (e.g. +237612345678). On Cameroon and other CEMAC
    routes AT delivers as bulk/A2P SMS — fine for OTP since the flow is
    outbound-only (the user types the code back into the app, not via SMS).
    """
    settings = get_settings()
    if not settings.AT_API_KEY:
        raise AuthError(code="sms.africastalking_not_configured")

    payload = {
        "username": settings.AT_USERNAME,
        "to": to,
        "message": message,
    }
    if settings.AT_SENDER_ID:
        payload["from"] = settings.AT_SENDER_ID

    url = f"{settings.AT_BASE_URL.rstrip('/')}/version1/messaging"
    headers = {
        "ApiKey": settings.AT_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, headers=headers, data=payload)

    if response.status_code >= 400:
        raise AuthError(
            code="sms.africastalking_http_error",
            extra={"http_status": response.status_code, "body": response.text[:500]},
        )

    body = response.json()
    recipients = body.get("SMSMessageData", {}).get("Recipients", [])
    if not recipients:
        raise AuthError(
            code="sms.africastalking_no_recipients",
            extra={"response": body},
        )
    status_code = recipients[0].get("statusCode")
    # AT statusCode 100, 101, 102 = queued/sent (success). Anything else = failure.
    if status_code not in (100, 101, 102):
        raise AuthError(
            code="sms.africastalking_rejected",
            extra={"recipient": recipients[0]},
        )
    return body
