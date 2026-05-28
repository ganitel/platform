"""Outbound confirmation email when someone joins the waitlist.

Best-effort wrt the form submission: we never raise out of here, so a
Resend hiccup doesn't 5xx the join request. But the caller surfaces
whether the send succeeded so the frontend can tell the truth instead
of pretending success.
"""

import asyncio
import logging
from html import escape

import resend  # type: ignore[import-untyped]

from app.core.config import get_settings
from app.modules.waitlist.models import WaitlistEntry

logger = logging.getLogger(__name__)


def _render(entry: WaitlistEntry) -> tuple[str, str]:
    """Return (subject, html). Copy adapts to whether the visitor signed up
    as a host or traveler, and whether they pinned a specific
    property/experience or expressed broad interest."""
    audience = "hôte" if entry.role == "host" else "voyageur"
    audience_en = "host" if entry.role == "host" else "traveler"

    if entry.role == "host":
        subject = "Bienvenue sur ganitel — votre projet d'hôte"
        intro = (
            "Merci d'avoir partagé votre projet d'hébergement. "
            "Un membre de l'équipe vous écrira pour comprendre vos envies "
            "et la suite des étapes."
        )
    elif entry.property_id or entry.experience_id:
        target_label = "ce séjour" if entry.property_id else "cette expérience"
        subject = f"ganitel — votre place sur {target_label}"
        intro = (
            f"Merci de votre intérêt pour {target_label}. "
            "Nous vous écrirons en priorité dès l'ouverture des réservations."
        )
    else:
        subject = "Bienvenue sur la liste ganitel"
        intro = (
            "Merci d'avoir rejoint la liste. Nous vous écrirons dès "
            "l'ouverture des réservations, séjours et expériences inclus."
        )

    safe_name = escape(entry.name) if entry.name else ""
    greeting = f"Bonjour {safe_name}," if safe_name else "Bonjour,"

    html = f"""
<!doctype html>
<html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">{escape(subject)}</h2>
  <p>{escape(greeting)}</p>
  <p>{escape(intro)}</p>
  <p style="font-size:13px;color:#666">Inscription enregistrée en tant que {escape(audience)} ({escape(audience_en)}).</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#888">
    ganitel — séjours et expériences soigneusement choisis au Cameroun.
  </p>
</body></html>
""".strip()
    return subject, html


def _send_one(*, to: str, subject: str, html: str) -> bool:
    s = get_settings()
    if not s.RESEND_API_KEY:
        logger.warning(
            "waitlist.email.skipped reason=no_api_key to=%s subject=%s",
            to,
            subject,
        )
        return False
    resend.api_key = s.RESEND_API_KEY
    logger.info(
        "waitlist.email.sending to=%s from=%s subject=%s",
        to,
        s.RESEND_FROM_EMAIL,
        subject,
    )
    try:
        result = resend.Emails.send(
            {
                "from": s.RESEND_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception:
        logger.exception("waitlist.email.failed to=%s", to)
        return False
    email_id = result.get("id") if isinstance(result, dict) else None
    logger.info("waitlist.email.sent to=%s resend_id=%s", to, email_id)
    return True


async def send_confirmation(entry: WaitlistEntry) -> bool:
    """Sends the visitor a confirmation. Returns True if Resend accepted it,
    False otherwise — the caller decides how to tell the frontend."""
    subject, html = _render(entry)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        lambda: _send_one(to=entry.email, subject=subject, html=html),
    )
