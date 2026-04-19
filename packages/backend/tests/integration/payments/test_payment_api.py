"""
Tests d'intégration pour l'API Payments
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from app.config import get_settings

from app.domain.entities.payment import Payment, PaymentStatus
from app.domain.entities.booking import Booking, BookingStatus
from app.domain.entities.service import Service
from app.domain.entities.user import User, UserType
from app.infrastructure.external_apis.tranzak_client import TranzakClient

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def mock_tranzak_calls(monkeypatch):
    async def mock_initiate_payment(
        self,
        amount,
        currency,
        description,
        customer_email,
        customer_phone,
        customer_name,
        reference,
        callback_url,
        return_url
    ):
        return {
            "success": True,
            "transaction_id": "REQ_TEST_123",
            "payment_url": "https://pay.tranzak.me/flow/REQ_TEST_123",
            "data": {
                "requestId": "REQ_TEST_123",
                "links": {"paymentAuthUrl": "https://pay.tranzak.me/flow/REQ_TEST_123"}
            }
        }

    async def mock_void_request(self, transaction_id):
        return {"success": True, "data": {"requestId": transaction_id}}

    monkeypatch.setattr(TranzakClient, "initiate_payment", mock_initiate_payment)
    monkeypatch.setattr(TranzakClient, "void_request", mock_void_request)
    monkeypatch.setattr(TranzakClient, "cancel_request", mock_void_request)


# Removed - using sample_user from conftest.py instead


@pytest.fixture
def test_service(db_session, sample_provider):
    """Créer un service de test"""
    service = Service(
        id=uuid4(),
        provider_id=sample_provider.id,
        title="Test Service",
        description="Test description with enough characters",
        service_type="accommodation",
        accommodation_type="apartment",
        country="Cameroon",
        city="Douala",
        address="Test Address",
        latitude=4.0511,
        longitude=9.7679,
        base_price=Decimal("25000.00"),
        currency="XAF",
        status="active",
        is_active=True
    )
    db_session.add(service)
    db_session.commit()
    db_session.refresh(service)
    return service


@pytest.fixture
def test_booking(db_session, sample_user, test_service):
    """Créer une réservation de test"""
    from datetime import date, timedelta
    
    booking = Booking(
        id=uuid4(),
        user_id=sample_user.id,
        service_id=test_service.id,
        start_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=15),
        guests=2,
        status=BookingStatus.PENDING.value,
        total_amount=Decimal("125000.00"),
        currency="XAF",
        is_active=True
    )
    db_session.add(booking)
    db_session.commit()
    return booking


class TestPaymentAPI:
    """Tests pour l'API Payments"""
    
    def test_initiate_payment_success(self, client, test_booking, auth_headers):
        """Test initiation de paiement réussie"""
        response = client.post(
            "/api/v1/payments/initiate",
            json={
                "booking_id": str(test_booking.id),
                "payment_method": "mtn"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "payment_id" in data
        assert data["amount"] == 125000.0
        assert data["currency"] == "XAF"
        assert data["status"] == "pending"
    
    def test_initiate_payment_duplicate(self, client, test_booking, auth_headers, db_session):
        """Test initiation de paiement en double"""
        # Créer un premier paiement
        payment = Payment(
            id=uuid4(),
            booking_id=test_booking.id,
            amount=test_booking.total_amount,
            currency=test_booking.currency,
            provider="tranzak",
            status=PaymentStatus.COMPLETED.value,
            is_active=True
        )
        db_session.add(payment)
        db_session.commit()
        
        # Essayer de créer un second paiement
        response = client.post(
            "/api/v1/payments/initiate",
            json={
                "booking_id": str(test_booking.id)
            },
            headers=auth_headers
        )
        
        assert response.status_code == 409
        assert "already completed" in response.json()["detail"].lower()
    
    def test_get_payment_details(self, client, test_booking, admin_token, db_session):
        """Test récupération des détails d'un paiement"""
        payment = Payment(
            id=uuid4(),
            booking_id=test_booking.id,
            amount=test_booking.total_amount,
            currency=test_booking.currency,
            provider="tranzak",
            status=PaymentStatus.COMPLETED.value,
            transaction_id="tranzak-123",
            is_active=True
        )
        db_session.add(payment)
        db_session.commit()

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get(
            f"/api/v1/payments/{payment.id}",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(payment.id)
        assert data["status"] == "completed"
        assert data["transaction_id"] == "tranzak-123"
    
    def test_get_payment_unauthorized(self, client, test_booking, db_session):
        """Test accès non autorisé à un paiement"""
        payment = Payment(
            id=uuid4(),
            booking_id=test_booking.id,
            amount=test_booking.total_amount,
            currency=test_booking.currency,
            provider="tranzak",
            status=PaymentStatus.COMPLETED.value,
            is_active=True
        )
        db_session.add(payment)
        db_session.commit()
        
        response = client.get(f"/api/v1/payments/{payment.id}")
        
        assert response.status_code == 401
    
    def test_list_user_payments(self, client, test_booking, auth_headers, db_session):
        """Test liste des paiements d'un utilisateur"""
        # Créer plusieurs paiements
        from datetime import date, timedelta
        
        for i in range(3):
            booking = Booking(
                id=uuid4(),
                user_id=test_booking.user_id,
                service_id=test_booking.service_id,
                start_date=date.today() + timedelta(days=20 + i * 10),
                end_date=date.today() + timedelta(days=25 + i * 10),
                guests=2,
                status=BookingStatus.CONFIRMED.value,
                total_amount=Decimal("100000.00") + Decimal(i * 10000),
                currency="XAF",
                is_active=True
            )
            db_session.add(booking)
            db_session.flush()  # Flush to get booking ID
            
            payment = Payment(
                id=uuid4(),
                booking_id=booking.id,
                amount=booking.total_amount,
                currency=booking.currency,
                provider="tranzak",
                status=PaymentStatus.COMPLETED.value,
                is_active=True
            )
            db_session.add(payment)
        
        db_session.commit()
        
        response = client.get(
            "/api/v1/payments/",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "payments" in data
        assert len(data["payments"]) >= 3
        assert data["total"] >= 3
    
    def test_webhook_tranzak_success(self, client, test_booking, db_session):
        """Test webhook Tranzak pour paiement réussi"""
        payment = Payment(
            id=uuid4(),
            booking_id=test_booking.id,
            amount=test_booking.total_amount,
            currency=test_booking.currency,
            provider="tranzak",
            status=PaymentStatus.PENDING.value,
            transaction_id="tranzak-webhook-123",
            is_active=True
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        settings = get_settings()
        auth_key = (
            settings.TRANZAK_WEBHOOK_AUTH_KEY
            if getattr(settings, "TRANZAK_WEBHOOK_AUTH_KEY", None)
            else settings.TRANZAK_WEBHOOK_SECRET
        )
        webhook_id = (
            settings.TRANZAK_WEBHOOK_ID
            if getattr(settings, "TRANZAK_WEBHOOK_ID", "")
            else "WEBHOOK_TEST_1"
        )
        
        response = client.post(
            "/api/v1/payments/webhook/tranzak",
            json={
                "name": "Tranzak Payment Notification (TPN)",
                "version": "1.0",
                "eventType": "REQUEST.COMPLETED",
                "appId": settings.TRANZAK_APP_ID,
                "resourceId": "tranzak-webhook-123",
                "resource": {
                    "requestId": "tranzak-webhook-123",
                    "status": "SUCCESSFUL",
                    "mchTransactionRef": str(test_booking.id),
                    "amount": float(test_booking.total_amount),
                    "currencyCode": "XAF",
                    "paymentMethod": "mtn"
                },
                "webhookId": webhook_id,
                "creationDateTime": "2026-02-09T10:00:00+00:00",
                "authKey": auth_key
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Vérifier que le paiement est mis à jour
        db_session.refresh(payment)
        assert payment.status == PaymentStatus.COMPLETED.value
        
        # Vérifier que la réservation est confirmée
        db_session.refresh(test_booking)
        assert test_booking.status == BookingStatus.CONFIRMED.value
