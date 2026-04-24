"""
Ganitel V2 Backend - Refresh Token Use Case
"""

import redis
from jose import jwt

from app.application.use_cases.auth.login_user import TokenData
from app.config import get_settings
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import AuthorizationError

settings = get_settings()


class RefreshTokenUseCase:
    """
    Use case for refreshing access tokens
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(
        self, refresh_token: str, redis_client: redis.Redis | None = None
    ) -> TokenData:
        """
        Refresh access token using refresh token

        Args:
            refresh_token: Refresh token
            redis_client: Redis client for validating refresh tokens

        Returns:
            TokenData: New access token and refresh token

        Raises:
            AuthorizationError: If refresh token is invalid
        """
        try:
            # Decode refresh token
            payload = jwt.decode(
                refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                issuer=settings.JWT_ISSUER,
                audience=settings.JWT_AUDIENCE,
            )

            user_id = payload.get("sub")
            token_type = payload.get("type")

            if token_type != "refresh" or not user_id:
                raise AuthorizationError("Invalid refresh token")

            # Verify token in Redis if available
            if redis_client:
                stored_token = redis_client.get(f"refresh_token:{user_id}")
                if isinstance(stored_token, bytes):
                    stored_token = stored_token.decode()
                if stored_token != refresh_token:
                    raise AuthorizationError("Refresh token has been revoked")

            # Get user
            from uuid import UUID

            user = self.user_repository.get_by_id(UUID(user_id))
            if not user or not user.is_active:
                raise AuthorizationError("User not found or inactive")

            # Generate new tokens using LoginUserUseCase logic
            from app.application.use_cases.auth.login_user import LoginUserUseCase

            login_use_case = LoginUserUseCase(self.user_repository)

            return login_use_case.refresh_access_token(refresh_token, redis_client)

        except jwt.ExpiredSignatureError:
            raise AuthorizationError("Refresh token has expired") from None
        except jwt.JWTError:
            raise AuthorizationError("Invalid refresh token") from None
