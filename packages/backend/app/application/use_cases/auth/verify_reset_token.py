"""
Ganitel V2 Backend - Verify Reset Token Use Case
"""
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import AuthorizationError

class VerifyResetTokenUseCase:
    """
    Use case for verifying password reset token validity
    """
    
    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository
    
    def execute(self, token: str) -> dict:
        """
        Verify if reset token is valid
        
        Args:
            token: Password reset token
            
        Returns:
            dict: Verification result
            
        Raises:
            AuthorizationError: If token is invalid or expired
        """
        if not token:
            raise AuthorizationError("Reset token is required")
        
        # Find user by reset token
        user = self.user_repository.get_by_reset_token(token)
        
        if not user:
            raise AuthorizationError("Invalid or expired reset token")
        
        return {
            "message": "Reset token is valid",
            "success": True
        }

