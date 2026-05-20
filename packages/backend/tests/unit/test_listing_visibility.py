"""Unit tests for listing detail visibility."""

from types import SimpleNamespace
from uuid import uuid4

from app.modules.experiences import service as experience_service
from app.modules.experiences.models import ExperienceStatus
from app.modules.properties import service as property_service
from app.modules.properties.models import PropertyStatus

HOST_ID = uuid4()
OTHER_ID = uuid4()


def _user(*, user_id=OTHER_ID, is_admin=False, status="active"):
    return SimpleNamespace(id=user_id, is_admin=is_admin, status=status)


def _property(*, status=PropertyStatus.PUBLISHED):
    return SimpleNamespace(host_id=HOST_ID, status=status)


def _experience(*, status=ExperienceStatus.PUBLISHED):
    return SimpleNamespace(host_id=HOST_ID, status=status)


def test_property_detail_visibility_hides_unpublished_from_anonymous_users() -> None:
    assert property_service.can_view_detail(_property(status=PropertyStatus.PUBLISHED), None)
    assert not property_service.can_view_detail(_property(status=PropertyStatus.UNLISTED), None)
    assert not property_service.can_view_detail(_property(status=PropertyStatus.REMOVED), None)


def test_property_detail_visibility_allows_active_owner_or_admin() -> None:
    draft = _property(status=PropertyStatus.DRAFT)

    assert property_service.can_view_detail(draft, _user(user_id=HOST_ID))
    assert property_service.can_view_detail(draft, _user(is_admin=True))
    assert not property_service.can_view_detail(draft, _user(user_id=HOST_ID, status="inactive"))
    assert not property_service.can_view_detail(draft, _user(user_id=OTHER_ID))


def test_experience_detail_visibility_hides_unpublished_from_anonymous_users() -> None:
    assert experience_service.can_view_detail(_experience(status=ExperienceStatus.PUBLISHED), None)
    assert not experience_service.can_view_detail(
        _experience(status=ExperienceStatus.UNLISTED), None
    )
    assert not experience_service.can_view_detail(
        _experience(status=ExperienceStatus.REMOVED), None
    )


def test_experience_detail_visibility_allows_active_owner_or_admin() -> None:
    draft = _experience(status=ExperienceStatus.DRAFT)

    assert experience_service.can_view_detail(draft, _user(user_id=HOST_ID))
    assert experience_service.can_view_detail(draft, _user(is_admin=True))
    assert not experience_service.can_view_detail(draft, _user(user_id=HOST_ID, status="inactive"))
    assert not experience_service.can_view_detail(draft, _user(user_id=OTHER_ID))
