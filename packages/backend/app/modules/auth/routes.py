"""Auth-provider webhooks.

Supabase Auth Send SMS Hook → Africa's Talking. The hook fires when
Supabase needs to deliver an OTP via SMS; we forward the OTP to AT.

Hook spec: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
Signature: Standard Webhooks (https://www.standardwebhooks.com/).
"""

import base64
import hashlib
import hmac
import time

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from app.core.config import get_settings
from app.modules.auth.sms_router import send_otp

router = APIRouter(prefix="/webhooks/auth", tags=["webhooks"])

_TIMESTAMP_TOLERANCE_SECONDS = 5 * 60


class _SmsHookUser(BaseModel):
    id: str
    phone: str | None = None


class _SmsHookSms(BaseModel):
    otp: str


class _SmsHookPayload(BaseModel):
    user: _SmsHookUser
    sms: _SmsHookSms


def _verify_signature(secret: str, headers: dict[str, str], body: bytes) -> None:
    webhook_id = headers.get("webhook-id")
    webhook_timestamp = headers.get("webhook-timestamp")
    webhook_signature = headers.get("webhook-signature")
    if not webhook_id or not webhook_timestamp or not webhook_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="missing webhook headers"
        )

    try:
        ts = int(webhook_timestamp)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="invalid timestamp"
        ) from e
    if abs(time.time() - ts) > _TIMESTAMP_TOLERANCE_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="timestamp out of tolerance"
        )

    key = secret
    for prefix in ("v1,whsec_", "whsec_"):
        if key.startswith(prefix):
            key = key[len(prefix) :]
            break
    secret_bytes = base64.b64decode(key)

    signed = f"{webhook_id}.{webhook_timestamp}.{body.decode('utf-8')}".encode()
    expected = base64.b64encode(hmac.new(secret_bytes, signed, hashlib.sha256).digest()).decode()

    received = [s.split(",", 1)[1] for s in webhook_signature.split() if "," in s]
    if not any(hmac.compare_digest(expected, sig) for sig in received):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid signature")


@router.post("/sms", status_code=status.HTTP_200_OK)
async def supabase_sms_hook(request: Request) -> dict:
    settings = get_settings()
    if not settings.SUPABASE_AUTH_HOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="hook secret not configured"
        )

    body = await request.body()
    _verify_signature(settings.SUPABASE_AUTH_HOOK_SECRET, dict(request.headers), body)

    payload = _SmsHookPayload.model_validate_json(body)
    if not payload.user.phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user has no phone")

    message = f"Your ganitel code is {payload.sms.otp}"
    await send_otp(to=payload.user.phone, message=message)
    return {}
