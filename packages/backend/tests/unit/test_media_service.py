"""Pure-unit tests for media service helpers."""

from app.modules.media.service import _make_key


def test_make_key_jpeg() -> None:
    key = _make_key("user-1", "image/jpeg")
    assert key.startswith("u/user-1/") and key.endswith(".jpg")


def test_make_key_avif() -> None:
    key = _make_key("user-1", "image/avif")
    assert key.endswith(".avif")


def test_make_key_video_mp4() -> None:
    key = _make_key("user-1", "video/mp4")
    assert key.endswith(".mp4")


def test_make_key_video_webm() -> None:
    key = _make_key("user-1", "video/webm")
    assert key.endswith(".webm")


def test_make_key_unknown_falls_back_to_bin() -> None:
    key = _make_key("user-1", "application/octet-stream")
    assert key.endswith(".bin")
