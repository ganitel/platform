from fastapi import APIRouter

from app.modules.auth.routes import router as auth_webhooks_router
from app.modules.bookings.routes import router as bookings_router
from app.modules.experiences.routes import router as experiences_router
from app.modules.media.routes import router as media_router
from app.modules.payments.routes import router as webhooks_router
from app.modules.properties.routes import router as properties_router
from app.modules.reference.routes import router as reference_router
from app.modules.team.routes import router as team_router
from app.modules.users.routes import router as users_router
from app.modules.waitlist.routes import router as waitlist_router

api_router = APIRouter()


@api_router.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(users_router)
api_router.include_router(reference_router)
api_router.include_router(team_router)
api_router.include_router(media_router)
api_router.include_router(properties_router)
api_router.include_router(experiences_router)
api_router.include_router(bookings_router)
api_router.include_router(webhooks_router)
api_router.include_router(waitlist_router)
api_router.include_router(auth_webhooks_router)
