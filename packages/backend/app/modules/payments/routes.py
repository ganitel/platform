from fastapi import APIRouter, Request, status

from app.core.deps import DbSession
from app.modules.payments import service as payment_service
from app.modules.payments.providers import get_provider

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _handle(provider_name: str, request: Request, session: DbSession) -> dict:
    provider = get_provider(provider_name)
    body = await request.body()
    event = await provider.parse_webhook(headers=dict(request.headers), body=body)
    await payment_service.apply_webhook_event(session, provider_name=provider_name, event=event)
    return {"received": True, "intent_id": event.provider_intent_id, "status": event.status}


@router.post("/tranzak", status_code=status.HTTP_200_OK)
async def tranzak_webhook(request: Request, session: DbSession) -> dict:
    return await _handle("tranzak", request, session)


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, session: DbSession) -> dict:
    return await _handle("stripe", request, session)


@router.post("/noop", status_code=status.HTTP_200_OK)
async def noop_webhook(request: Request, session: DbSession) -> dict:
    """Dev-only — call this with `{"intent_id": "noop-...", "status": "captured"}` to confirm a noop payment."""
    return await _handle("noop", request, session)
