"""
Ganitel V2 Backend - User Management Use Cases Tests
"""

from uuid import uuid4

import pytest
from passlib.context import CryptContext

from app.application.use_cases.users import (
    ChangePasswordUseCase,
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    UpdateUserStatusUseCase,
    VerifyUserUseCase,
)
from app.domain.entities.user import User, UserStatus, UserType
from app.exceptions import AuthorizationError, UserNotFoundError, ValidationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestGetUserProfileUseCase:
    """Tests for GetUserProfileUseCase"""

    def test_get_user_profile_success(self, user_repository, sample_user):
        """Test successful profile retrieval"""
        use_case = GetUserProfileUseCase(user_repository)

        user = use_case.execute(sample_user.id)

        assert user.id == sample_user.id
        assert user.email == sample_user.email
        assert user.first_name == sample_user.first_name

    def test_get_user_profile_not_found(self, user_repository):
        """Test profile retrieval fails for non-existent user"""
        use_case = GetUserProfileUseCase(user_repository)

        with pytest.raises(UserNotFoundError):
            use_case.execute(uuid4())


class TestUpdateUserProfileUseCase:
    """Tests for UpdateUserProfileUseCase"""

    def test_update_profile_success(self, user_repository, sample_user):
        """Test successful profile update"""
        use_case = UpdateUserProfileUseCase(user_repository)

        update_data = {"first_name": "Updated", "bio": "New bio", "city": "Yaoundé"}

        updated_user = use_case.execute(user_id=sample_user.id, update_data=update_data)

        assert updated_user.first_name == "Updated"
        assert updated_user.bio == "New bio"
        assert updated_user.city == "Yaoundé"

    def test_update_profile_not_found(self, user_repository):
        """Test update fails for non-existent user"""
        use_case = UpdateUserProfileUseCase(user_repository)

        with pytest.raises(UserNotFoundError):
            use_case.execute(user_id=uuid4(), update_data={"first_name": "Test"})

    def test_update_profile_invalid_field(self, user_repository, sample_user):
        """Test update fails with invalid field"""
        use_case = UpdateUserProfileUseCase(user_repository)

        with pytest.raises(ValidationError, match="cannot be updated"):
            use_case.execute(
                user_id=sample_user.id, update_data={"email": "new@example.com"}
            )

    def test_update_profile_empty_name(self, user_repository, sample_user):
        """Test update fails with empty name"""
        use_case = UpdateUserProfileUseCase(user_repository)

        with pytest.raises(ValidationError, match="cannot be empty"):
            use_case.execute(user_id=sample_user.id, update_data={"first_name": "   "})


class TestChangePasswordUseCase:
    """Tests for ChangePasswordUseCase"""

    def test_change_password_success(self, user_repository, sample_user):
        """Test successful password change"""
        use_case = ChangePasswordUseCase(user_repository)

        result = use_case.execute(
            user_id=sample_user.id,
            current_password="password123",
            new_password="newpassword456",
        )

        assert result is True

        # Verify new password works
        from passlib.context import CryptContext

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        updated_user = user_repository.get_by_id(sample_user.id)
        assert pwd_context.verify("newpassword456", updated_user.hashed_password)

    def test_change_password_wrong_current(self, user_repository, sample_user):
        """Test password change fails with wrong current password"""
        use_case = ChangePasswordUseCase(user_repository)

        with pytest.raises(AuthorizationError, match="Current password is incorrect"):
            use_case.execute(
                user_id=sample_user.id,
                current_password="wrongpassword",
                new_password="newpassword456",
            )

    def test_change_password_weak_new(self, user_repository, sample_user):
        """Test password change fails with weak new password"""
        use_case = ChangePasswordUseCase(user_repository)

        with pytest.raises(ValidationError, match="at least 8 characters"):
            use_case.execute(
                user_id=sample_user.id,
                current_password="password123",
                new_password="short",
            )

    def test_change_password_not_found(self, user_repository):
        """Test password change fails for non-existent user"""
        use_case = ChangePasswordUseCase(user_repository)

        with pytest.raises(UserNotFoundError):
            use_case.execute(
                user_id=uuid4(),
                current_password="password123",
                new_password="newpassword456",
            )


class TestUpdateUserStatusUseCase:
    """Tests for UpdateUserStatusUseCase"""

    def test_update_status_inactive_to_active(self, user_repository, db_session):
        """Test successful status transition: inactive → active"""
        user = User(
            id=uuid4(),
            email="inactive@example.com",
            phone="+237690000300",
            first_name="Inactive",
            last_name="User",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.INACTIVE.value,
            is_verified=False,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = UpdateUserStatusUseCase(user_repository)

        updated_user = use_case.execute(user_id=user.id, new_status=UserStatus.ACTIVE)

        assert updated_user.status == UserStatus.ACTIVE.value
        assert updated_user.is_verified is True

    def test_update_status_active_to_suspended(self, user_repository, sample_user):
        """Test successful status transition: active → suspended"""
        use_case = UpdateUserStatusUseCase(user_repository)

        updated_user = use_case.execute(
            user_id=sample_user.id, new_status=UserStatus.SUSPENDED
        )

        assert updated_user.status == UserStatus.SUSPENDED.value

    def test_update_status_suspended_to_active(self, user_repository, db_session):
        """Test successful status transition: suspended → active"""
        user = User(
            id=uuid4(),
            email="suspended@example.com",
            phone="+237690000301",
            first_name="Suspended",
            last_name="User",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.SUSPENDED.value,
            is_verified=True,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = UpdateUserStatusUseCase(user_repository)

        updated_user = use_case.execute(user_id=user.id, new_status=UserStatus.ACTIVE)

        assert updated_user.status == UserStatus.ACTIVE.value

    def test_update_status_invalid_transition(self, user_repository, sample_user):
        """Test status update fails with invalid transition"""
        use_case = UpdateUserStatusUseCase(user_repository)

        with pytest.raises(ValidationError, match="Cannot transition"):
            use_case.execute(
                user_id=sample_user.id, new_status=UserStatus.PENDING_VERIFICATION
            )

    def test_update_status_not_found(self, user_repository):
        """Test status update fails for non-existent user"""
        use_case = UpdateUserStatusUseCase(user_repository)

        with pytest.raises(UserNotFoundError):
            use_case.execute(user_id=uuid4(), new_status=UserStatus.ACTIVE)


class TestVerifyUserUseCase:
    """Tests for VerifyUserUseCase"""

    def test_verify_email_success(self, user_repository, db_session):
        """Test successful email verification"""
        user = User(
            id=uuid4(),
            email="unverified@example.com",
            phone="+237690000400",
            first_name="Unverified",
            last_name="User",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.PENDING_VERIFICATION.value,
            is_verified=False,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = VerifyUserUseCase(user_repository)

        verified_user = use_case.execute(user_id=user.id, verification_type="email")

        assert verified_user.is_verified is True
        assert verified_user.status == UserStatus.ACTIVE.value

    def test_verify_phone_success(self, user_repository, db_session):
        """Test successful phone verification"""
        user = User(
            id=uuid4(),
            phone="+237690000401",
            first_name="Phone",
            last_name="User",
            user_type=UserType.TRAVELER.value,
            status=UserStatus.PENDING_VERIFICATION.value,
            is_verified=False,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = VerifyUserUseCase(user_repository)

        verified_user = use_case.execute(user_id=user.id, verification_type="phone")

        assert verified_user.is_verified is True

    def test_verify_user_no_email(self, user_repository, db_session):
        """Test verification fails when user has no email"""
        user = User(
            id=uuid4(),
            phone="+237690000402",
            first_name="Phone",
            last_name="User",
            user_type=UserType.TRAVELER.value,
            status=UserStatus.PENDING_VERIFICATION.value,
            is_verified=False,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = VerifyUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="does not have an email"):
            use_case.execute(user_id=user.id, verification_type="email")

    def test_verify_invalid_type(self, user_repository, sample_user):
        """Test verification fails with invalid type"""
        use_case = VerifyUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Invalid verification type"):
            use_case.execute(user_id=sample_user.id, verification_type="invalid")  # ty: ignore[invalid-argument-type]
