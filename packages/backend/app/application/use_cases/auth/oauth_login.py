"""
Ganitel V2 Backend - OAuth Login Use Case
"""

import secrets
from datetime import datetime

from passlib.context import CryptContext

from app.config import get_settings
from app.domain.entities.user import User, UserStatus, UserType
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import ConflictError, ValidationError
from app.infrastructure.external_apis.oauth_client import (
    FacebookOAuthClient,
    GoogleOAuthClient,
)
from app.utils.security import create_access_token

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class OAuthLoginUseCase:
    """
    Use case for OAuth authentication (Google & Facebook)
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    async def execute_google(self, code: str) -> dict:
        """
        Handle Google OAuth login

        Args:
            code: Authorization code from Google

        Returns:
            dict: User info and tokens
        """
        # Exchange code for access token
        token_data = await GoogleOAuthClient.get_access_token(code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise ValidationError("Failed to get access token from Google")

        # Get user info from Google
        user_info = await GoogleOAuthClient.get_user_info(access_token)

        email = user_info.get("email")
        if not email or not user_info.get("verified_email", False):
            raise ValidationError("Email not verified by Google")

        oauth_id = user_info.get("id")
        first_name = user_info.get("given_name", "")
        last_name = user_info.get("family_name", "")
        profile_picture = user_info.get("picture")

        return await self._handle_oauth_user(
            email=email,
            oauth_id=oauth_id,
            provider="google",
            first_name=first_name,
            last_name=last_name,
            profile_picture=profile_picture,
        )

    async def execute_facebook(self, code: str) -> dict:
        """
        Handle Facebook OAuth login

        Args:
            code: Authorization code from Facebook

        Returns:
            dict: User info and tokens
        """
        # Exchange code for access token
        token_data = await FacebookOAuthClient.get_access_token(code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise ValidationError("Failed to get access token from Facebook")

        # Get user info from Facebook
        user_info = await FacebookOAuthClient.get_user_info(access_token)

        email = user_info.get("email")
        if not email:
            raise ValidationError("Email not provided by Facebook")

        oauth_id = user_info.get("id")
        name = user_info.get("name", "")
        name_parts = name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        profile_picture = user_info.get("picture_url")

        return await self._handle_oauth_user(
            email=email,
            oauth_id=oauth_id,
            provider="facebook",
            first_name=first_name,
            last_name=last_name,
            profile_picture=profile_picture,
        )

    async def _handle_oauth_user(
        self,
        email: str,
        oauth_id: str,
        provider: str,
        first_name: str,
        last_name: str,
        profile_picture: str | None = None,
    ) -> dict:
        """Handle OAuth user login or registration"""
        # Check if user exists by OAuth ID
        user = self.user_repository.get_by_oauth_id(oauth_id, provider)

        if not user:
            # Check if user exists by email
            user = self.user_repository.get_by_email(email)

            if user:
                # User exists but with different auth method
                if user.auth_type != provider:
                    raise ConflictError(
                        f"This email is already registered with {user.auth_type} authentication. "
                        f"Please login using {user.auth_type}."
                    )
            else:
                # Create new user
                user = await self._create_oauth_user(
                    email=email,
                    oauth_id=oauth_id,
                    provider=provider,
                    first_name=first_name,
                    last_name=last_name,
                    profile_picture=profile_picture,
                )

        # Generate JWT tokens
        jwt_token = create_access_token(str(user.id))

        # Update last login
        user.last_login_at = datetime.utcnow()
        self.user_repository.update(user)

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": user.full_name,
                "user_type": user.user_type,
                "profile_picture": user.profile_picture,
                "is_verified": user.is_verified,
            },
            "access_token": jwt_token,
            "token_type": "bearer",
        }

    async def _create_oauth_user(
        self,
        email: str,
        oauth_id: str,
        provider: str,
        first_name: str,
        last_name: str,
        profile_picture: str | None = None,
    ) -> User:
        """Create a new user from OAuth"""
        from uuid import uuid4

        # Generate random password (user won't use it)
        random_password = secrets.token_urlsafe(32)
        hashed_password = pwd_context.hash(random_password)

        # Create user
        user = User(
            id=uuid4(),
            email=email.lower(),
            first_name=first_name or "User",
            last_name=last_name or "",
            hashed_password=hashed_password,
            user_type=UserType.TRAVELER.value,
            status=UserStatus.ACTIVE.value,
            is_verified=True,  # OAuth users are pre-verified
            profile_picture=profile_picture,
            auth_type=provider,
            oauth_id=oauth_id,
            oauth_provider=provider,
            is_active=True,
        )

        return self.user_repository.create(user)
