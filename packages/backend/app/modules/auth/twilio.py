"""Twilio SMS client — outbound only.

Used for OTP delivery to numbers outside Africa's Talking's footprint
(non-African country codes). For African numbers we prefer AT for cost
and delivery reliability — see sms_router.send_otp.
"""

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import AuthError


async def send_sms(*, to: str, message: str) -> dict[str, Any]:
    """Send a single SMS via Twilio. Raises AuthError on failure.

    `to` must be E.164 (e.g. +33760440874).
    """
    settings = get_settings()
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        raise AuthError(code="sms.twilio_not_configured")

    data: dict[str, str] = {"To": to, "Body": message}
    if settings.TWILIO_MESSAGING_SERVICE_SID:
        data["MessagingServiceSid"] = settings.TWILIO_MESSAGING_SERVICE_SID
    elif settings.TWILIO_FROM_NUMBER:
        data["From"] = settings.TWILIO_FROM_NUMBER
    else:
        raise AuthError(code="sms.twilio_no_sender")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    auth = httpx.BasicAuth(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, auth=auth, data=data)

    if response.status_code >= 400:
        raise AuthError(code="sms.twilio_http_error")

    body = response.json()
    twilio_status = body.get("status")
    # queued, accepted, sending, sent = success; failed/undelivered = error
    if twilio_status in ("failed", "undelivered"):
        raise AuthError(code="sms.twilio_rejected")
    return body
