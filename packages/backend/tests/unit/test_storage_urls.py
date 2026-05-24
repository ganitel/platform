"""Unit tests for the pure URL builders in app.core.storage.

These do not touch the network or S3 — they only assemble strings from
settings, so they belong in tests/unit/.
"""

from unittest.mock import patch

import pytest

from app.core.config import Settings
from app.core.storage import image_transform_url, public_url


def _settings(**overrides) -> Settings:
    base = {
        "SUPABASE_PROJECT_URL": "https://example.supabase.co",
        "S3_BUCKET": "ganitel-uploads",
        "SUPABASE_IMAGE_TRANSFORMS_ENABLED": False,
    }
    base.update(overrides)
    return Settings(**base)


@pytest.fixture
def settings_no_transforms():
    with patch("app.core.storage.get_settings", return_value=_settings()):
        yield


@pytest.fixture
def settings_with_transforms():
    with patch(
        "app.core.storage.get_settings",
        return_value=_settings(SUPABASE_IMAGE_TRANSFORMS_ENABLED=True),
    ):
        yield


def test_public_url_builds_supabase_public_object_url(settings_no_transforms):
    assert (
        public_url("u/abc/123.jpg")
        == "https://example.supabase.co/storage/v1/object/public/ganitel-uploads/u/abc/123.jpg"
    )


def test_public_url_passes_through_http_keys(settings_no_transforms):
    """Seed/demo escape hatch: pre-existing keys that are already absolute URLs."""
    url = "https://cdn.example.com/seed/hero.jpg"
    assert public_url(url) == url


def test_image_transform_url_falls_back_to_public_when_disabled(
    settings_no_transforms,
):
    assert (
        image_transform_url("u/abc/123.jpg", width=800)
        == "https://example.supabase.co/storage/v1/object/public/ganitel-uploads/u/abc/123.jpg"
    )


def test_image_transform_url_uses_render_endpoint_when_enabled(
    settings_with_transforms,
):
    url = image_transform_url("u/abc/123.jpg", width=800, quality=80, fmt="webp")
    assert url.startswith(
        "https://example.supabase.co/storage/v1/render/image/public/ganitel-uploads/u/abc/123.jpg?"
    )
    assert "width=800" in url
    assert "quality=80" in url
    assert "format=webp" in url
