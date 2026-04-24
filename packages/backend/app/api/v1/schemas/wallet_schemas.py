"""
Ganitel V2 Backend - Wallet API Schemas
"""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class WalletResponse(BaseModel):
    """Wallet response schema"""
    id: str
    user_id: str
    current_balance: Decimal
    withdrawn: Decimal
    received: Decimal
    gross_balance: Decimal
    deposits: Decimal
    bonuses: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AddBalanceRequest(BaseModel):
    """Add balance request schema"""
    amount: Decimal = Field(..., gt=0, description="Amount to add")
    is_bonus: bool = Field(False, description="Whether this is a bonus")
    description: str | None = Field(None, description="Transaction description")

class TransactionResponse(BaseModel):
    """Transaction response schema"""
    id: str
    user_id: str
    wallet_id: str | None
    transaction_type: str
    amount: Decimal
    currency: str
    description: str | None
    status: str
    reference: str | None
    created_at: datetime

    class Config:
        from_attributes = True

