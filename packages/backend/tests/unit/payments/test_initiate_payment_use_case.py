"""
Tests unitaires pour InitiatePaymentUseCase
"""

from decimal import Decimal
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from app.application.use_cases.payments.initiate_payment import InitiatePaymentUseCase
from app.domain.entities.booking import Booking, BookingStatus
from app.domain.entities.payment import Payment, PaymentStatus
from app.domain.entities.user import User, UserType
from app.exceptions import (
    BookingNotFoundError,
    ConflictError,
    ValidationError,
)


class TestInitiatePaymentUseCase:
    """Tests pour InitiatePaymentUseCase"""

    @pytest.fixture
    def mock_repositories(self):
        """Mock des repositories"""
        return {
            "payment_repo": Mock(),
            "booking_repo": Mock(),
            "user_repo": Mock(),
            "tranzak_client": Mock(),
        }

    @pytest.fixture
    def use_case(self, mock_repositories):
        """Instance du use case avec mocks"""
        return InitiatePaymentUseCase(
            mock_repositories["payment_repo"],
            mock_repositories["booking_repo"],
            mock_repositories["user_repo"],
            mock_repositories["tranzak_client"],
        )

    @pytest.mark.asyncio
    async def test_initiate_payment_success(self, use_case, mock_repositories):
        """Test initiation de paiement réussie"""
        # Setup
        user_id = uuid4()
        booking_id = uuid4()
        service_id = uuid4()

        user = User(
            id=user_id,
            email="test@example.com",
            first_name="Test",
            last_name="User",
            user_type=UserType.TRAVELER.value,
            is_active=True,
        )

        booking = Booking(
            id=booking_id,
            user_id=user_id,
            service_id=service_id,
            start_date="2025-12-10",
            end_date="2025-12-15",
            guests=2,
            status=BookingStatus.PENDING.value,
            total_amount=Decimal("125000.00"),
            currency="XAF",
            is_active=True,
        )

        mock_repositories["booking_repo"].get_by_id.return_value = booking
        mock_repositories["user_repo"].get_by_id.return_value = user
        mock_repositories["payment_repo"].get_by_booking_id.return_value = None

        # Mock Tranzak response
        mock_repositories["tranzak_client"].initiate_payment = AsyncMock(
            return_value={
                "success": True,
                "transaction_id": "tranzak-123",
                "payment_url": "https://pay.tranzak.me/test",
                "data": {},
            }
        )

        payment = Payment(
            id=uuid4(),
            booking_id=booking_id,
            amount=booking.total_amount,
            currency=booking.currency,
            provider="tranzak",
            status=PaymentStatus.PENDING.value,
            transaction_id="tranzak-123",
            is_active=True,
        )
        mock_repositories["payment_repo"].create.return_value = payment
        mock_repositories["payment_repo"].update.return_value = payment

        # Execute
        result = await use_case.execute(
            booking_id=booking_id,
            user_id=user_id,
            callback_url="http://test.com/webhook",
            return_url="http://test.com/success",
        )

        # Assert
        assert result["payment_id"] == str(payment.id)
        assert result["transaction_id"] == "tranzak-123"
        assert result["payment_url"] == "https://pay.tranzak.me/test"
        assert result["status"] == "pending"

    @pytest.mark.asyncio
    async def test_initiate_payment_booking_not_found(
        self, use_case, mock_repositories
    ):
        """Test initiation avec réservation inexistante"""
        mock_repositories["booking_repo"].get_by_id.return_value = None

        with pytest.raises(BookingNotFoundError):
            await use_case.execute(
                booking_id=uuid4(),
                user_id=uuid4(),
                callback_url="http://test.com/webhook",
                return_url="http://test.com/success",
            )

    @pytest.mark.asyncio
    async def test_initiate_payment_wrong_user(self, use_case, mock_repositories):
        """Test initiation par un utilisateur non propriétaire"""
        user_id = uuid4()
        other_user_id = uuid4()
        booking_id = uuid4()

        booking = Booking(
            id=booking_id,
            user_id=other_user_id,  # Différent user
            service_id=uuid4(),
            start_date="2025-12-10",
            end_date="2025-12-15",
            guests=2,
            status=BookingStatus.PENDING.value,
            total_amount=Decimal("125000.00"),
            currency="XAF",
            is_active=True,
        )

        mock_repositories["booking_repo"].get_by_id.return_value = booking

        with pytest.raises(ValidationError, match="does not belong"):
            await use_case.execute(
                booking_id=booking_id,
                user_id=user_id,
                callback_url="http://test.com/webhook",
                return_url="http://test.com/success",
            )

    @pytest.mark.asyncio
    async def test_initiate_payment_already_completed(
        self, use_case, mock_repositories
    ):
        """Test initiation pour réservation déjà payée"""
        user_id = uuid4()
        booking_id = uuid4()

        booking = Booking(
            id=booking_id,
            user_id=user_id,
            service_id=uuid4(),
            start_date="2025-12-10",
            end_date="2025-12-15",
            guests=2,
            status=BookingStatus.PENDING.value,
            total_amount=Decimal("125000.00"),
            currency="XAF",
            is_active=True,
        )

        existing_payment = Payment(
            id=uuid4(),
            booking_id=booking_id,
            amount=booking.total_amount,
            currency=booking.currency,
            provider="tranzak",
            status=PaymentStatus.COMPLETED.value,
            is_active=True,
        )

        mock_repositories["booking_repo"].get_by_id.return_value = booking
        mock_repositories[
            "payment_repo"
        ].get_by_booking_id.return_value = existing_payment

        with pytest.raises(ConflictError, match="already completed"):
            await use_case.execute(
                booking_id=booking_id,
                user_id=user_id,
                callback_url="http://test.com/webhook",
                return_url="http://test.com/success",
            )
