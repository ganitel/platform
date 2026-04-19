"""
Ganitel V2 Backend - Update User Profile Use Case
"""
from uuid import UUID
from typing import Optional, Dict, Any

from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import UserNotFoundError, ValidationError


class UpdateUserProfileUseCase:
    """
    Use case for updating user profile
    """
    
    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository
    
    def execute(
        self,
        user_id: UUID,
        update_data: Dict[str, Any],
        updated_by: Optional[UUID] = None
    ) -> User:
        """
        Update user profile
        
        Args:
            user_id: User ID to update
            update_data: Dictionary with fields to update
            updated_by: ID of user making the update (for audit)
            
        Returns:
            User: Updated user entity
            
        Raises:
            UserNotFoundError: If user not found
            ValidationError: If validation fails
        """
        user = self.user_repository.get_by_id(user_id)
        
        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")
        
        # Validate and update fields
        allowed_fields = [
            'first_name', 'last_name', 'bio', 'profile_picture',
            'country', 'city', 'language', 'currency'
        ]
        
        for field, value in update_data.items():
            if field not in allowed_fields:
                raise ValidationError(f"Field '{field}' cannot be updated")
            
            if value is not None:
                # Additional validation
                if field in ['first_name', 'last_name']:
                    if not value.strip():
                        raise ValidationError(f"{field} cannot be empty")
                    if len(value.strip()) > 100:
                        raise ValidationError(f"{field} must be less than 100 characters")
                
                setattr(user, field, value.strip() if isinstance(value, str) else value)
        
        # Set updated_by for audit
        if updated_by:
            user.updated_by = updated_by
        
        # Save changes
        updated_user = self.user_repository.update(user)
        
        return updated_user

