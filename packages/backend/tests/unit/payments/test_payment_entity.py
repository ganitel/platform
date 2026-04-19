"""
Tests unitaires pour l'entité Payment
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

from app.domain.entities.payment import Payment, PaymentStatus, PaymentProvider


class TestPaymentEntity:
    """Tests pour l'entité Payment"""
    
    def test_create_payment(self):
        """Test création d'un paiement"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.PENDING.value,
            is_active=True
        )
        
        assert payment.id is not None
        assert payment.amount == Decimal("100000.00")
        assert payment.status == PaymentStatus.PENDING.value
        assert payment.provider == PaymentProvider.TRANZAK.value
    
    def test_can_be_refunded_completed(self):
        """Test qu'un paiement completed peut être remboursé"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.COMPLETED.value,
            is_active=True
        )
        
        assert payment.can_be_refunded() is True
    
    def test_cannot_be_refunded_pending(self):
        """Test qu'un paiement pending ne peut pas être remboursé"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.PENDING.value,
            is_active=True
        )
        
        assert payment.can_be_refunded() is False
    
    def test_mark_completed(self):
        """Test marquer un paiement comme completed"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.PENDING.value,
            is_active=True
        )
        
        payment.mark_completed("tranzak-123", '{"success": true}')
        
        assert payment.status == PaymentStatus.COMPLETED.value
        assert payment.transaction_id == "tranzak-123"
        assert payment.provider_response == '{"success": true}'
    
    def test_mark_failed(self):
        """Test marquer un paiement comme failed"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.PENDING.value,
            is_active=True
        )
        
        payment.mark_failed("Payment declined")
        
        assert payment.status == PaymentStatus.FAILED.value
        assert payment.error_message == "Payment declined"
    
    def test_process_refund(self):
        """Test traiter un remboursement"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.COMPLETED.value,
            is_active=True
        )
        
        payment.process_refund(50000.0, "Customer request")
        
        assert payment.status == PaymentStatus.REFUNDED.value
        assert payment.refund_amount == 50000.0
        assert payment.refund_reason == "Customer request"
        assert payment.refunded_at is not None
    
    def test_process_refund_invalid_amount(self):
        """Test remboursement avec montant invalide"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.COMPLETED.value,
            is_active=True
        )
        
        with pytest.raises(ValueError, match="Refund amount cannot exceed payment amount"):
            payment.process_refund(150000.0, "Customer request")
    
    def test_process_refund_not_completed(self):
        """Test remboursement d'un paiement non completed"""
        payment = Payment(
            id=uuid4(),
            booking_id=uuid4(),
            amount=Decimal("100000.00"),
            currency="XAF",
            provider=PaymentProvider.TRANZAK.value,
            status=PaymentStatus.PENDING.value,
            is_active=True
        )
        
        with pytest.raises(ValueError, match="Payment cannot be refunded"):
            payment.process_refund(50000.0, "Customer request")
