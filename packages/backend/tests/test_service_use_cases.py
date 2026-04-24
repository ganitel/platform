"""
Unit tests for service (listing) use cases
"""
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.application.use_cases.services.delete_service import DeleteServiceUseCase
from app.application.use_cases.services.update_service import UpdateServiceUseCase
from app.exceptions import AuthorizationError, ServiceNotFoundError, ValidationError


def _build_service(provider_id):
    service = MagicMock()
    service.id = uuid4()
    service.provider_id = provider_id
    service.base_price = 50000
    service.generate_slug = MagicMock()
    service.slug = "test-slug"
    return service


def test_update_service_success():
    provider_id = uuid4()
    service = _build_service(provider_id)

    repository = MagicMock()
    repository.get_by_id.return_value = service
    repository.slug_exists.return_value = False
    repository.update.return_value = service

    use_case = UpdateServiceUseCase(repository)

    result = use_case.execute(service.id, provider_id, {"title": "Super listing", "base_price": 60000})

    repository.update.assert_called_once()
    assert result == service


def test_update_service_unauthorized():
    provider_id = uuid4()
    another_provider = uuid4()
    repository = MagicMock()
    repository.get_by_id.return_value = _build_service(provider_id)
    use_case = UpdateServiceUseCase(repository)

    with pytest.raises(AuthorizationError):
        use_case.execute(uuid4(), another_provider, {"title": "Bad request"})


def test_update_service_invalid_price():
    provider_id = uuid4()
    repository = MagicMock()
    repository.get_by_id.return_value = _build_service(provider_id)
    use_case = UpdateServiceUseCase(repository)

    with pytest.raises(ValidationError):
        use_case.execute(uuid4(), provider_id, {"base_price": -10})


def test_delete_service_success():
    provider_id = uuid4()
    service = _build_service(provider_id)
    repository = MagicMock()
    repository.get_by_id.return_value = service
    use_case = DeleteServiceUseCase(repository)

    use_case.execute(service.id, provider_id)
    repository.soft_delete.assert_called_once_with(service.id)


def test_delete_service_not_found():
    repository = MagicMock()
    repository.get_by_id.return_value = None
    use_case = DeleteServiceUseCase(repository)

    with pytest.raises(ServiceNotFoundError):
        use_case.execute(uuid4(), uuid4())

