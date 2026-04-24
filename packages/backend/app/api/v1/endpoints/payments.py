"""
Ganitel V2 Backend - Payment Endpoints
"""

import hmac
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.payment_schemas import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentListResponse,
    PaymentRefundRequest,
    PaymentRefundResponse,
    PaymentResponse,
    PaymentWebhookRequest,
)
from app.application.use_cases.payments import (
    GetPaymentUseCase,
    InitiatePaymentUseCase,
    ProcessRefundUseCase,
    ProcessWebhookUseCase,
)
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_admin
from app.domain.entities.user import User, UserType
from app.exceptions import GanitelError
from app.infrastructure.external_apis.tranzak_client import get_tranzak_client
from app.infrastructure.repositories.booking_repository import BookingRepository
from app.infrastructure.repositories.payment_repository import PaymentRepository
from app.infrastructure.repositories.user_repository import UserRepository

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.post(
    "/initiate",
    response_model=PaymentInitiateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_payment(
    payload: PaymentInitiateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Initiate payment for a booking

    Creates a payment record and returns payment URL for customer
    """
    try:
        payment_repo = PaymentRepository(db)
        booking_repo = BookingRepository(db)
        user_repo = UserRepository(db)
        tranzak_client = get_tranzak_client()

        use_case = InitiatePaymentUseCase(
            payment_repo, booking_repo, user_repo, tranzak_client
        )

        result = await use_case.execute(
            booking_id=UUID(payload.booking_id),
            user_id=current_user.id,
            payment_method=payload.payment_method,
            callback_url=settings.PAYMENT_CALLBACK_URL,
            return_url=settings.PAYMENT_RETURN_URL,
        )

        return PaymentInitiateResponse(
            payment_id=result["payment_id"],
            transaction_id=result.get("transaction_id"),
            payment_url=result.get("payment_url"),
            amount=result["amount"],
            currency=result["currency"],
            status=result["status"],
            message="Payment initiated successfully. Please complete payment at the provided URL.",
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking ID format"
        ) from None
    except GanitelError:
        raise
    except Exception:
        logger.exception("Unhandled payment initiation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment initiation failed",
        ) from None


@router.post("/webhook/tranzak", status_code=status.HTTP_200_OK)
async def tranzak_webhook(
    request: Request, payload: PaymentWebhookRequest, db: Session = Depends(get_db)
):
    """
    Webhook endpoint for Tranzak payment notifications

    This endpoint is called by Tranzak when payment status changes
    """
    try:
        expected_auth_key = (
            settings.TRANZAK_WEBHOOK_AUTH_KEY
            if getattr(settings, "TRANZAK_WEBHOOK_AUTH_KEY", None)
            else settings.TRANZAK_WEBHOOK_SECRET
        )

        if not expected_auth_key or not hmac.compare_digest(
            payload.auth_key.encode("utf-8"), expected_auth_key.encode("utf-8")
        ):
            return {"success": False, "message": "Invalid webhook auth key"}

        if payload.event_type != "REQUEST.COMPLETED":
            return {
                "success": False,
                "message": f"Unsupported event type: {payload.event_type}",
            }

        if payload.app_id != settings.TRANZAK_APP_ID:
            return {"success": False, "message": "Webhook appId mismatch"}

        if getattr(settings, "TRANZAK_WEBHOOK_ID", ""):
            if payload.webhook_id != settings.TRANZAK_WEBHOOK_ID:
                return {"success": False, "message": "Webhook ID mismatch"}

        payment_repo = PaymentRepository(db)
        booking_repo = BookingRepository(db)

        use_case = ProcessWebhookUseCase(payment_repo, booking_repo)

        resource = payload.resource
        transaction_id = resource.request_id or payload.resource_id
        merchant_transaction_id = resource.mch_transaction_ref
        status = resource.status or ""

        result = use_case.execute(
            transaction_id=transaction_id,
            status=status,
            merchant_transaction_id=merchant_transaction_id,
            payment_method=resource.payment_method,
        )

        return {"success": True, "message": result.get("message", "Webhook processed")}

    except GanitelError as exc:
        # Return 200 even on error to prevent Tranzak from retrying
        return {"success": False, "message": exc.message}
    except Exception:
        logger.exception("Unhandled Tranzak webhook processing error")
        return {"success": False, "message": "Webhook processing failed"}


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get payment details"""
    try:
        payment_repo = PaymentRepository(db)
        use_case = GetPaymentUseCase(payment_repo)

        payment = use_case.execute(
            payment_id=UUID(payment_id),
            requester_id=current_user.id,
            is_admin=current_user.user_type == UserType.ADMIN.value,
        )

        return PaymentResponse.from_orm(payment)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment ID format"
        ) from None
    except GanitelError:
        raise
    except Exception:
        logger.exception("Unhandled payment retrieval error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment",
        ) from None


@router.get("/", response_model=PaymentListResponse)
async def list_user_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user's payment history"""
    try:
        payment_repo = PaymentRepository(db)

        payments = payment_repo.get_user_payments(
            user_id=current_user.id, skip=skip, limit=limit
        )

        total = payment_repo.count({"user_id": current_user.id})

        return PaymentListResponse(
            payments=[PaymentResponse.from_orm(p) for p in payments],
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            pages=(total + limit - 1) // limit,
        )

    except Exception:
        logger.exception("Unhandled payment listing error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payments",
        ) from None


@router.post("/{payment_id}/refund", response_model=PaymentRefundResponse)
async def refund_payment(
    payment_id: str,
    payload: PaymentRefundRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Process a refund (Admin only)
    """
    try:
        payment_repo = PaymentRepository(db)
        tranzak_client = get_tranzak_client()

        use_case = ProcessRefundUseCase(payment_repo, tranzak_client)

        result = await use_case.execute(
            payment_id=UUID(payment_id),
            refund_amount=payload.amount,
            reason=payload.reason,
        )

        return PaymentRefundResponse(
            payment_id=result["payment_id"],
            refund_amount=result["refund_amount"],
            status=result["status"],
            message=result["message"],
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment ID format"
        ) from None
    except GanitelError:
        raise
    except Exception:
        logger.exception("Unhandled refund processing error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Refund failed"
        ) from None
