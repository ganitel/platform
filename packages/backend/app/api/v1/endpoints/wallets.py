"""
Ganitel V2 Backend - Wallet Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.wallet_schemas import (
    AddBalanceRequest,
    TransactionResponse,
    WalletResponse,
)
from app.application.use_cases.wallets.add_balance import AddBalanceUseCase
from app.application.use_cases.wallets.create_wallet import CreateWalletUseCase
from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.exceptions import (
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.infrastructure.repositories.transaction_repository import TransactionRepository
from app.infrastructure.repositories.wallet_repository import WalletRepository

router = APIRouter(prefix="/wallets", tags=["wallets"])


@router.post("/", response_model=WalletResponse, status_code=status.HTTP_201_CREATED)
async def create_wallet(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Create wallet for current user"""
    try:
        wallet_repository = WalletRepository(db)
        use_case = CreateWalletUseCase(wallet_repository)

        wallet = use_case.execute(current_user.id)

        return WalletResponse(
            id=str(wallet.id),
            user_id=str(wallet.user_id),
            current_balance=wallet.current_balance,
            withdrawn=wallet.withdrawn,
            received=wallet.received,
            gross_balance=wallet.gross_balance,
            deposits=wallet.deposits,
            bonuses=wallet.bonuses,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at,
        )
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create wallet",
        ) from None


@router.get("/me", response_model=WalletResponse)
async def get_my_wallet(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get current user's wallet"""
    try:
        wallet_repository = WalletRepository(db)
        wallet = wallet_repository.get_by_user_id(current_user.id)

        if not wallet:
            raise NotFoundError("Wallet not found")

        return WalletResponse(
            id=str(wallet.id),
            user_id=str(wallet.user_id),
            current_balance=wallet.current_balance,
            withdrawn=wallet.withdrawn,
            received=wallet.received,
            gross_balance=wallet.gross_balance,
            deposits=wallet.deposits,
            bonuses=wallet.bonuses,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get wallet",
        ) from None


@router.post("/me/add-balance", response_model=TransactionResponse)
async def add_balance(
    request: AddBalanceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Add balance to wallet"""
    try:
        wallet_repository = WalletRepository(db)
        transaction_repository = TransactionRepository(db)
        use_case = AddBalanceUseCase(wallet_repository, transaction_repository)

        result = use_case.execute(
            user_id=current_user.id,
            amount=request.amount,
            is_bonus=request.is_bonus,
            description=request.description,
        )

        transaction = result["transaction"]
        return TransactionResponse(
            id=str(transaction.id),
            user_id=str(transaction.user_id),
            wallet_id=str(transaction.wallet_id) if transaction.wallet_id else None,
            transaction_type=transaction.transaction_type,
            amount=transaction.amount,
            currency=transaction.currency,
            description=transaction.description,
            status=transaction.status,
            reference=transaction.reference,
            created_at=transaction.created_at,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add balance",
        ) from None
