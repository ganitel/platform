"""
Ganitel V2 Backend - Create Policy Use Case
"""
from uuid import UUID
from typing import Optional
import re

from app.domain.repositories.policy_repository import IPolicyRepository
from app.domain.entities.policy import Policy, PolicyType
from app.exceptions import ValidationError, ConflictError

class CreatePolicyUseCase:
    """Use case for creating a policy"""
    
    def __init__(self, policy_repository: IPolicyRepository):
        self.policy_repository = policy_repository
    
    def execute(
        self,
        title: str,
        content: str,
        policy_type: str,
        slug: Optional[str] = None,
        display_order: int = 0
    ) -> Policy:
        """
        Create a policy
        
        Args:
            title: Policy title
            content: Policy content
            policy_type: Policy type
            slug: URL slug (auto-generated if not provided)
            display_order: Display order
            
        Returns:
            Policy: Created policy
        """
        if not title or not content:
            raise ValidationError("Title and content are required")
        
        # Validate policy type
        try:
            PolicyType(policy_type)
        except ValueError:
            raise ValidationError(f"Invalid policy type: {policy_type}")
        
        # Generate slug if not provided
        if not slug:
            slug = self._generate_slug(title)
        
        # Check if slug exists
        existing = self.policy_repository.get_by_slug(slug)
        if existing:
            raise ConflictError(f"Policy with slug '{slug}' already exists")
        
        policy = Policy(
            title=title,
            content=content,
            policy_type=policy_type,
            slug=slug,
            display_order=display_order,
            is_active=True
        )
        
        return self.policy_repository.create(policy)
    
    def _generate_slug(self, title: str) -> str:
        """Generate URL slug from title"""
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug[:250]

