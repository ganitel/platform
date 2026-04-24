"""
Ganitel V2 Backend - Add Balance Use Case
"""
from decimal import Decimal
from uuid import UUID

from app.domain.entities.transaction import (
    Transaction,
    TransactionStatus,
    TransactionType,
)
from app.domain.repositories.transaction_repository import ITransactionRepository
from app.domain.repositories.wallet_repository import IWalletRepository
from app.exceptions import NotFoundError, ValidationError


class AddBalanceUseCase:
    """Use case for adding balance to wallet"""

    def __init__(
        self,
        wallet_repository: IWalletRepository,
        transaction_repository: ITransactionRepository
    ):
        self.wallet_repository = wallet_repository
        self.transaction_repository = transaction_repository

    def execute(
        self,
        user_id: UUID,
        amount: Decimal,
        is_bonus: bool = False,
        description: str = None
    ) -> dict:
        """
        Add balance to wallet

        Args:
            user_id: User ID
            amount: Amount to add
            is_bonus: Whether this is a bonus
            description: Transaction description

        Returns:
            dict: Updated wallet and transaction info
        """
        if amount <= 0:
            raise ValidationError("Amount must be greater than zero")

        # Get wallet
        wallet = self.wallet_repository.get_by_user_id(user_id)
        if not wallet:
            raise NotFoundError("Wallet not found")

        # Add balance
        wallet.add_balance(float(amount), is_bonus=is_bonus)
        wallet = self.wallet_repository.update(wallet)

        # Create transaction
        transaction = Transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type=TransactionType.DEPOSIT.value if not is_bonus else TransactionType.BONUS.value,
            amount=amount,
            currency="XAF",
            description=description or f"Balance added: {amount} XAF",
            status=TransactionStatus.COMPLETED.value
        )
        transaction = self.transaction_repository.create(transaction)

        return {
            "wallet": wallet,
            "transaction": transaction
        }

