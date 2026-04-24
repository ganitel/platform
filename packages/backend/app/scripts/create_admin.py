"""
Ganitel V2 Backend - Manual Admin Creation Script

Usage examples:
  python -m app.scripts.create_admin
  python -m app.scripts.create_admin --email admin@company.com --first-name Platform --last-name Admin
  python -m app.scripts.create_admin --email admin@company.com --password 'StrongPassword123!'

Optional environment overrides used by Make targets:
  ADMIN_CREATE_EMAIL
  ADMIN_CREATE_FIRST_NAME
  ADMIN_CREATE_LAST_NAME
  ADMIN_CREATE_PHONE
  ADMIN_CREATE_PASSWORD
"""

import argparse
import os
import sys

from passlib.context import CryptContext
from sqlalchemy import inspect

from app.config import get_settings
from app.database import SessionLocal
from app.domain.entities.user import User, UserStatus, UserType

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _resolve_value(
    cli_value: str | None, env_name: str, default: str | None = None
) -> str | None:
    if cli_value is not None and cli_value != "":
        return cli_value
    env_value = os.getenv(env_name)
    if env_value is not None and env_value != "":
        return env_value
    return default


def build_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or promote an admin account")
    parser.add_argument("--email", help="Admin email")
    parser.add_argument("--first-name", help="Admin first name")
    parser.add_argument("--last-name", help="Admin last name")
    parser.add_argument("--phone", help="Admin phone number")
    parser.add_argument(
        "--password",
        help="Admin password (avoid passing in shell history when possible)",
    )
    parser.add_argument(
        "--no-promote-existing",
        action="store_true",
        help="Fail if user exists but is not admin (default behavior is to promote existing user)",
    )
    return parser.parse_args()


def main() -> int:
    args = build_args()
    settings = get_settings()

    email = _resolve_value(args.email, "ADMIN_CREATE_EMAIL", settings.ADMIN_EMAIL)
    first_name = _resolve_value(
        args.first_name, "ADMIN_CREATE_FIRST_NAME", settings.ADMIN_FIRST_NAME
    )
    last_name = _resolve_value(
        args.last_name, "ADMIN_CREATE_LAST_NAME", settings.ADMIN_LAST_NAME
    )
    phone = _resolve_value(args.phone, "ADMIN_CREATE_PHONE", "+237600000000")
    password = _resolve_value(
        args.password, "ADMIN_CREATE_PASSWORD", settings.ADMIN_PASSWORD
    )

    if not email:
        print("❌ Missing email")
        return 1

    if not password:
        print("❌ Missing password")
        return 1

    db = SessionLocal()
    try:
        inspector = inspect(db.bind)
        if "users" not in inspector.get_table_names():  # ty: ignore[unresolved-attribute]
            print(
                "❌ Missing table 'users'. Run migrations first: make local-migrate / make staging-migrate"
            )
            return 1

        user = db.query(User).filter(User.email == email).first()

        if user:
            if user.deleted_at is not None:
                user.deleted_at = None

            if user.user_type == UserType.ADMIN.value:
                user.first_name = first_name or user.first_name
                user.last_name = last_name or user.last_name
                user.phone = phone or user.phone
                user.status = UserStatus.ACTIVE.value
                user.is_active = True
                user.is_verified = True
                user.hashed_password = pwd_context.hash(password)
                db.commit()
                print(f"✅ Admin already existed and has been refreshed: {email}")
                return 0

            if args.no_promote_existing:
                print(f"❌ User exists and is not admin: {email}")
                return 1

            user.user_type = UserType.ADMIN.value
            user.status = UserStatus.ACTIVE.value
            user.is_active = True
            user.is_verified = True
            user.first_name = first_name or user.first_name
            user.last_name = last_name or user.last_name
            user.phone = phone or user.phone
            user.hashed_password = pwd_context.hash(password)
            db.commit()
            print(f"✅ Existing user promoted to admin: {email}")
            return 0

        admin_user = User(
            email=email,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            hashed_password=pwd_context.hash(password),
            user_type=UserType.ADMIN.value,
            status=UserStatus.ACTIVE.value,
            is_verified=True,
            is_active=True,
        )

        db.add(admin_user)
        db.commit()
        print(f"✅ Admin user created successfully: {email}")
        return 0

    except Exception as error:
        db.rollback()
        print(f"❌ Failed to create/promote admin: {error}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
