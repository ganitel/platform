"""
Ganitel V2 Backend - Create Wallet Use Case
"""
from uuid import UUID

from app.domain.entities.wallet import Wallet
from app.domain.repositories.wallet_repository import IWalletRepository
from app.exceptions import ConflictError


class CreateWalletUseCase:
    """Use case for creating a wallet for a user"""

    def __init__(self, wallet_repository: IWalletRepository):
        self.wallet_repository = wallet_repository

    def execute(self, user_id: UUID) -> Wallet:
        """
        Create wallet for user

        Args:
            user_id: User ID

        Returns:
            Wallet: Created wallet

        Raises:
            ConflictError: If wallet already exists
        """
        # Check if wallet already exists
        existing_wallet = self.wallet_repository.get_by_user_id(user_id)
        if existing_wallet:
            raise ConflictError("Wallet already exists for this user")

        # Create wallet
        wallet = self.wallet_repository.create_for_user(user_id)
        return wallet

