"""Outbound email for team-admin notifications via Resend.

Best-effort: if `RESEND_API_KEY` is unset (local dev without secrets) we log
the attempt and return without raising, so form submission still succeeds.
"""

import asyncio
import logging
from html import escape

import resend  # type: ignore[import-untyped]

from app.core.config import get_settings
from app.modules.team.models import TeamMember

logger = logging.getLogger(__name__)


def _format_field(label: str, value: str | int | None) -> str:
    if value in (None, ""):
        return ""
    return (
        f'<tr><td style="padding:4px 12px 4px 0;color:#666">{escape(label)}</td>'
        f"<td><strong>{escape(str(value))}</strong></td></tr>"
    )


def _build_html(member: TeamMember, review_url: str) -> str:
    rows = "".join(
        [
            _format_field("Name", member.name),
            _format_field("Role", member.role),
            _format_field("City", member.city),
            _format_field("Country", member.country),
            _format_field("Age", member.age),
            _format_field("About", member.bio_fr or member.bio_en),
        ]
    )
    avatar = (
        f'<p><img src="{escape(member.avatar_url)}" alt="" '
        f'style="max-width:160px;border-radius:8px"></p>'
        if member.avatar_url
        else ""
    )
    return f"""
<!doctype html>
<html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">New team-member submission</h2>
  <p>Someone submitted the /add-team form. Review and approve below.</p>
  {avatar}
  <table style="border-collapse:collapse;font-size:14px;margin:12px 0 20px">{rows}</table>
  <p>
    <a href="{escape(review_url)}"
       style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
      Review &amp; approve
    </a>
  </p>
  <p style="font-size:12px;color:#888">This link expires in 7 days. If you didn't expect this, ignore the email.</p>
</body></html>
""".strip()


def _send_one(*, to: str, subject: str, html: str) -> None:
    s = get_settings()
    if not s.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY unset — skipping team-admin email to %s. Subject: %s",
            to,
            subject,
        )
        return
    resend.api_key = s.RESEND_API_KEY
    try:
        resend.Emails.send(
            {
                "from": s.RESEND_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception:
        # Best-effort: never crash the submission because email failed.
        logger.exception("Failed to send team-admin email to %s", to)


async def notify_admins(member: TeamMember, *, admin_emails: list[str], review_url_builder) -> int:
    """Fire-and-forget email to every admin. Returns the count attempted.

    `review_url_builder(admin_email) -> str` lets the caller mint a per-admin
    tokenized link so each email contains the recipient's specific token."""
    subject = f"Ganitel — new team-member submission: {member.name}"
    loop = asyncio.get_running_loop()
    for admin in admin_emails:
        url = review_url_builder(admin)
        html = _build_html(member, url)
        # resend SDK is synchronous; offload so we don't block the event loop.
        await loop.run_in_executor(
            None, lambda to=admin, subj=subject, h=html: _send_one(to=to, subject=subj, html=h)
        )
    return len(admin_emails)
