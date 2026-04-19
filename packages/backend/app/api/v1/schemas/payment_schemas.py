"""
Ganitel V2 Backend - Payment Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PaymentInitiateRequest(BaseModel):
    """Request to initiate a payment"""
    booking_id: str = Field(..., description="Booking ID to pay for")
    payment_method: Optional[str] = Field(None, description="Payment method (mtn, orange, visa, etc.)")


class PaymentInitiateResponse(BaseModel):
    """Response after initiating a payment"""
    payment_id: str
    transaction_id: Optional[str]
    payment_url: Optional[str]
    amount: float
    currency: str
    status: str
    message: str


class PaymentResponse(BaseModel):
    """Payment details response"""
    id: str
    booking_id: str
    amount: float
    currency: str
    provider: str
    transaction_id: Optional[str]
    status: str
    payment_method: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    @classmethod
    def from_orm(cls, payment):
        """Custom from_orm to handle type conversions"""
        return cls(
            id=str(payment.id),
            booking_id=str(payment.booking_id),
            amount=float(payment.amount),
            currency=payment.currency,
            provider=payment.provider,
            transaction_id=payment.transaction_id,
            status=payment.status,
            payment_method=payment.payment_method,
            error_message=payment.error_message,
            created_at=payment.created_at,
            updated_at=payment.updated_at
        )
    
    class Config:
        from_attributes = True


class TranzakWebhookResource(BaseModel):
    """TPN resource payload with transaction details"""
    request_id: Optional[str] = Field(None, alias="requestId")
    status: Optional[str] = None
    mch_transaction_ref: Optional[str] = Field(None, alias="mchTransactionRef")
    amount: Optional[float] = None
    currency_code: Optional[str] = Field(None, alias="currencyCode")
    payment_method: Optional[str] = Field(None, alias="paymentMethod")

    class Config:
        allow_population_by_field_name = True
        extra = "allow"


class PaymentWebhookRequest(BaseModel):
    """Tranzak TPN webhook payload"""
    name: Optional[str] = None
    version: Optional[str] = None
    event_type: str = Field(..., alias="eventType")
    app_id: str = Field(..., alias="appId")
    resource_id: str = Field(..., alias="resourceId")
    resource: TranzakWebhookResource
    webhook_id: str = Field(..., alias="webhookId")
    creation_date_time: Optional[str] = Field(None, alias="creationDateTime")
    auth_key: str = Field(..., alias="authKey")

    class Config:
        allow_population_by_field_name = True
        extra = "allow"


class PaymentRefundRequest(BaseModel):
    """Request to refund a payment"""
    amount: Optional[float] = Field(None, description="Refund amount (full refund if not specified)")
    reason: str = Field(..., min_length=10, max_length=500, description="Refund reason")


class PaymentRefundResponse(BaseModel):
    """Response after processing a refund"""
    payment_id: str
    refund_amount: float
    status: str
    message: str


class PaymentListResponse(BaseModel):
    """List of payments with pagination"""
    payments: list[PaymentResponse]
    total: int
    page: int
    per_page: int
    pages: int
