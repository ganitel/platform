from types import SimpleNamespace
from uuid import uuid4

import pytest
from starlette.responses import Response

from app.core.cache import PUBLIC_CDN_CACHE
from app.core.errors import NotFoundError
from app.modules.experiences.models import ExperienceStatus
from app.modules.experiences.routes import (
    PRIVATE_DETAIL_CACHE as EXPERIENCE_PRIVATE_DETAIL_CACHE,
)
from app.modules.experiences.routes import (
    _set_detail_cache_and_enforce_visibility as enforce_experience_visibility,
)
from app.modules.properties.models import PropertyStatus
from app.modules.properties.routes import (
    PRIVATE_DETAIL_CACHE as PROPERTY_PRIVATE_DETAIL_CACHE,
)
from app.modules.properties.routes import (
    _set_detail_cache_and_enforce_visibility as enforce_property_visibility,
)


def _listing(status, host_id):
    return SimpleNamespace(status=status, host_id=host_id)


def _user(user_id, *, is_admin=False, status="active"):
    return SimpleNamespace(id=user_id, is_admin=is_admin, status=status)


@pytest.mark.unit
@pytest.mark.parametrize(
    ("status", "cache_header"),
    [
        (PropertyStatus.PUBLISHED, PUBLIC_CDN_CACHE),
        (PropertyStatus.DRAFT, PROPERTY_PRIVATE_DETAIL_CACHE),
        (PropertyStatus.UNLISTED, PROPERTY_PRIVATE_DETAIL_CACHE),
        (PropertyStatus.REMOVED, PROPERTY_PRIVATE_DETAIL_CACHE),
    ],
)
def test_property_detail_visibility_allows_owner_and_sets_cache(status, cache_header) -> None:
    host_id = uuid4()
    response = Response()

    enforce_property_visibility(response, _listing(status, host_id), _user(host_id))

    assert response.headers["Cache-Control"] == cache_header


@pytest.mark.unit
@pytest.mark.parametrize(
    "status",
    [PropertyStatus.DRAFT, PropertyStatus.UNLISTED, PropertyStatus.REMOVED],
)
def test_property_detail_visibility_hides_non_public_listing_from_anonymous(status) -> None:
    response = Response()

    with pytest.raises(NotFoundError) as exc:
        enforce_property_visibility(response, _listing(status, uuid4()), None)
    assert exc.value.code == "property.not_found"


@pytest.mark.unit
def test_property_detail_visibility_allows_admin_for_private_listing() -> None:
    response = Response()

    enforce_property_visibility(
        response,
        _listing(PropertyStatus.REMOVED, uuid4()),
        _user(uuid4(), is_admin=True),
    )

    assert response.headers["Cache-Control"] == PROPERTY_PRIVATE_DETAIL_CACHE


@pytest.mark.unit
@pytest.mark.parametrize("is_admin", [False, True])
def test_property_detail_visibility_hides_private_listing_from_inactive_user(
    is_admin,
) -> None:
    user_id = uuid4()
    response = Response()

    with pytest.raises(NotFoundError) as exc:
        enforce_property_visibility(
            response,
            _listing(PropertyStatus.DRAFT, user_id),
            _user(user_id, is_admin=is_admin, status="suspended"),
        )

    assert exc.value.code == "property.not_found"


@pytest.mark.unit
@pytest.mark.parametrize(
    ("status", "cache_header"),
    [
        (ExperienceStatus.PUBLISHED, PUBLIC_CDN_CACHE),
        (ExperienceStatus.DRAFT, EXPERIENCE_PRIVATE_DETAIL_CACHE),
        (ExperienceStatus.UNLISTED, EXPERIENCE_PRIVATE_DETAIL_CACHE),
        (ExperienceStatus.REMOVED, EXPERIENCE_PRIVATE_DETAIL_CACHE),
    ],
)
def test_experience_detail_visibility_allows_owner_and_sets_cache(status, cache_header) -> None:
    host_id = uuid4()
    response = Response()

    enforce_experience_visibility(response, _listing(status, host_id), _user(host_id))

    assert response.headers["Cache-Control"] == cache_header


@pytest.mark.unit
@pytest.mark.parametrize(
    "status",
    [ExperienceStatus.DRAFT, ExperienceStatus.UNLISTED, ExperienceStatus.REMOVED],
)
def test_experience_detail_visibility_hides_non_public_listing_from_anonymous(status) -> None:
    response = Response()

    with pytest.raises(NotFoundError) as exc:
        enforce_experience_visibility(response, _listing(status, uuid4()), None)
    assert exc.value.code == "experience.not_found"


@pytest.mark.unit
def test_experience_detail_visibility_allows_admin_for_private_listing() -> None:
    response = Response()

    enforce_experience_visibility(
        response,
        _listing(ExperienceStatus.REMOVED, uuid4()),
        _user(uuid4(), is_admin=True),
    )

    assert response.headers["Cache-Control"] == EXPERIENCE_PRIVATE_DETAIL_CACHE


@pytest.mark.unit
@pytest.mark.parametrize("is_admin", [False, True])
def test_experience_detail_visibility_hides_private_listing_from_inactive_user(
    is_admin,
) -> None:
    user_id = uuid4()
    response = Response()

    with pytest.raises(NotFoundError) as exc:
        enforce_experience_visibility(
            response,
            _listing(ExperienceStatus.DRAFT, user_id),
            _user(user_id, is_admin=is_admin, status="suspended"),
        )

    assert exc.value.code == "experience.not_found"
