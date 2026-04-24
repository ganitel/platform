"""
Ganitel V2 Backend - User API Schemas
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator, validator

from app.domain.entities.user import UserType


class UserResponse(BaseModel):
    id: str
    email: str | None
    phone: str | None
    first_name: str
    last_name: str
    full_name: str
    user_type: str
    status: str
    is_verified: bool
    profile_picture: str | None
    bio: str | None
    country: str | None
    city: str | None
    language: str | None
    currency: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserPublicResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    full_name: str
    profile_picture: str | None
    bio: str | None
    country: str | None
    city: str | None

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    bio: str | None = None
    profile_picture: str | None = None
    country: str | None = None
    city: str | None = None
    language: str | None = None
    currency: str | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Authentication Schemas
class UserCreateRequest(BaseModel):
    """Request schema for user registration"""
    email: EmailStr | None = Field(None, description="User email (required if phone not provided)")
    phone: str | None = Field(None, pattern=r"^\+\d{1,15}$", description="Phone number in international format (required if email not provided)")
    password: str | None = Field(None, min_length=8, description="Password (required for email registration)")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    user_type: str = Field("traveler", description="User type: traveler or provider")
    country: str | None = Field(None, max_length=100, description="User country")
    city: str | None = Field(None, max_length=100, description="User city")

    @validator('user_type')
    def validate_user_type(cls, v):
        valid_types = [UserType.TRAVELER.value, UserType.PROVIDER.value]
        if v.lower() not in valid_types:
            raise ValueError(f"user_type must be one of: {', '.join(valid_types)}")
        return v.lower()

    @model_validator(mode='after')
    def validate_contact_and_password(self):
        """Ensure at least email or phone is provided, and password is required for email"""
        # At least one contact method must be provided
        if not self.email and not self.phone:
            raise ValueError("Either email or phone must be provided")

        # Password is required if email is provided
        if self.email and not self.password:
            raise ValueError("Password is required for email registration")

        return self


class UserLoginRequest(BaseModel):
    """Request schema for user login"""
    identifier: str = Field(..., description="Email or phone number")
    password: str = Field(..., min_length=1, description="User password")


class TokenResponse(BaseModel):
    """Response schema for authentication tokens"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    refresh_token: str | None = Field(None, description="JWT refresh token")


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh"""
    refresh_token: str = Field(..., description="Refresh token")


class OAuthCodeExchangeRequest(BaseModel):
    """Request schema to exchange temporary OAuth code for API token"""
    code: str = Field(..., min_length=16, description="Temporary OAuth exchange code")
    provider: str = Field(..., description="OAuth provider")

    @validator('provider')
    def validate_provider(cls, v):
        allowed_providers = {"google", "facebook"}
        provider = v.lower()
        if provider not in allowed_providers:
            raise ValueError(f"provider must be one of: {', '.join(sorted(allowed_providers))}")
        return provider


# Password Reset Schemas
class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password"""
    email: EmailStr | None = Field(None, description="User email")
    phone: str | None = Field(None, pattern=r"^\+\d{1,15}$", description="Phone number in international format")

    @model_validator(mode='after')
    def validate_contact(self):
        """Ensure at least email or phone is provided"""
        if not self.email and not self.phone:
            raise ValueError("Either email or phone must be provided")
        return self


class ResetPasswordRequest(BaseModel):
    """Request schema for reset password"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")


class VerifyResetTokenRequest(BaseModel):
    """Request schema for verifying reset token"""
    token: str = Field(..., description="Password reset token")

