# 🔧 Ganitel V2 Backend - Service Layer Implementation

This document provides complete implementation details for the service layer that handles business logic, data processing, and external integrations.

---

## 🏗️ Base Service Classes (app/services/base.py)

```python
from typing import Optional, List, Dict, Any, TypeVar, Generic
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from uuid import UUID
import logging

from app.database import get_db
from app.models.base import BaseModel
from app.schemas.base import PaginationParams, PaginatedResponse

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base service class with common CRUD operations"""
    
    def __init__(self, model: type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    async def get(self, id: UUID, include_deleted: bool = False) -> Optional[ModelType]:
        """Get a single record by ID"""
        try:
            query = self.db.query(self.model).filter(self.model.id == id)
            
            if not include_deleted:
                query = query.filter(self.model.is_deleted == False)
            
            return query.first()
        except Exception as e:
            logger.error(f"Error getting {self.model.__name__} {id}: {str(e)}")
            raise
    
    async def get_multi(
        self,
        pagination: PaginationParams,
        filters: Optional[Dict[str, Any]] = None,
        include_deleted: bool = False,
        order_by: Optional[str] = None,
        order_desc: bool = True
    ) -> PaginatedResponse[ModelType]:
        """Get multiple records with pagination"""
        try:
            query = self.db.query(self.model)
            
            # Apply filters
            if not include_deleted:
                query = query.filter(self.model.is_deleted == False)
            
            if filters:
                for key, value in filters.items():
                    if hasattr(self.model, key) and value is not None:
                        if isinstance(value, list):
                            query = query.filter(getattr(self.model, key).in_(value))
                        else:
                            query = query.filter(getattr(self.model, key) == value)
            
            # Count total records
            total = query.count()
            
            # Apply ordering
            if order_by and hasattr(self.model, order_by):
                order_column = getattr(self.model, order_by)
                if order_desc:
                    query = query.order_by(desc(order_column))
                else:
                    query = query.order_by(asc(order_column))
            else:
                query = query.order_by(desc(self.model.created_at))
            
            # Apply pagination
            items = query.offset(pagination.offset).limit(pagination.size).all()
            
            return PaginatedResponse(
                items=items,
                total=total,
                page=pagination.page,
                size=pagination.size,
                pages=(total + pagination.size - 1) // pagination.size if total > 0 else 0
            )
        except Exception as e:
            logger.error(f"Error getting {self.model.__name__} list: {str(e)}")
            raise
    
    async def create(self, obj_in: CreateSchemaType, **kwargs) -> ModelType:
        """Create a new record"""
        try:
            # Convert Pydantic model to dict
            if hasattr(obj_in, 'model_dump'):
                obj_data = obj_in.model_dump(exclude_unset=True)
            else:
                obj_data = obj_in.dict(exclude_unset=True)
            
            # Add any additional fields
            obj_data.update(kwargs)
            
            # Create database object
            db_obj = self.model(**obj_data)
            self.db.add(db_obj)
            self.db.flush()  # Get ID without committing
            self.db.refresh(db_obj)
            
            return db_obj
        except Exception as e:
            logger.error(f"Error creating {self.model.__name__}: {str(e)}")
            self.db.rollback()
            raise
    
    async def update(
        self,
        db_obj: ModelType,
        obj_in: UpdateSchemaType,
        **kwargs
    ) -> ModelType:
        """Update an existing record"""
        try:
            # Convert Pydantic model to dict
            if hasattr(obj_in, 'model_dump'):
                update_data = obj_in.model_dump(exclude_unset=True, exclude_none=True)
            else:
                update_data = obj_in.dict(exclude_unset=True, exclude_none=True)
            
            # Add any additional fields
            update_data.update(kwargs)
            
            # Update object attributes
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            self.db.flush()
            self.db.refresh(db_obj)
            
            return db_obj
        except Exception as e:
            logger.error(f"Error updating {self.model.__name__} {db_obj.id}: {str(e)}")
            self.db.rollback()
            raise
    
    async def delete(self, id: UUID, soft_delete: bool = True) -> bool:
        """Delete a record (soft or hard delete)"""
        try:
            db_obj = await self.get(id)
            if not db_obj:
                return False
            
            if soft_delete and hasattr(db_obj, 'soft_delete'):
                db_obj.soft_delete()
            else:
                self.db.delete(db_obj)
            
            self.db.flush()
            return True
        except Exception as e:
            logger.error(f"Error deleting {self.model.__name__} {id}: {str(e)}")
            self.db.rollback()
            raise
    
    async def restore(self, id: UUID) -> Optional[ModelType]:
        """Restore a soft-deleted record"""
        try:
            db_obj = await self.get(id, include_deleted=True)
            if not db_obj or not hasattr(db_obj, 'restore'):
                return None
            
            db_obj.restore()
            self.db.flush()
            self.db.refresh(db_obj)
            
            return db_obj
        except Exception as e:
            logger.error(f"Error restoring {self.model.__name__} {id}: {str(e)}")
            self.db.rollback()
            raise
    
    async def exists(self, **filters) -> bool:
        """Check if a record exists with given filters"""
        try:
            query = self.db.query(self.model).filter(self.model.is_deleted == False)
            
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
            
            return query.first() is not None
        except Exception as e:
            logger.error(f"Error checking existence for {self.model.__name__}: {str(e)}")
            raise
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filters"""
        try:
            query = self.db.query(self.model).filter(self.model.is_deleted == False)
            
            if filters:
                for key, value in filters.items():
                    if hasattr(self.model, key) and value is not None:
                        query = query.filter(getattr(self.model, key) == value)
            
            return query.count()
        except Exception as e:
            logger.error(f"Error counting {self.model.__name__}: {str(e)}")
            raise

class ServiceException(Exception):
    """Base exception for service layer"""
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(ServiceException):
    """Validation error exception"""
    pass

class NotFoundError(ServiceException):
    """Not found error exception"""
    pass

class PermissionError(ServiceException):
    """Permission error exception"""
    pass

class BusinessLogicError(ServiceException):
    """Business logic error exception"""
    pass
```

---

## 👥 User Service (app/services/users.py)

```python
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from uuid import UUID
from datetime import datetime, timedelta
import secrets
import string

from app.services.base import BaseService, ValidationError, NotFoundError, BusinessLogicError
from app.models.users import User, UserOTP, UserRole, UserStatus, ContactType
from app.schemas.users import UserCreate, UserUpdate, UserListParams, OTPRequest, OTPVerify
from app.core.security import verify_password, get_password_hash
from app.core.config import get_settings
from app.services.communication import CommunicationService

settings = get_settings()

class UserService(BaseService[User, UserCreate, UserUpdate]):
    """User management service"""
    
    def __init__(self, db: Session):
        super().__init__(User, db)
        self.communication_service = CommunicationService(db)
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with validation"""
        # Check if user already exists
        existing_user = await self.get_by_whatsapp(user_data.whatsapp)
        if existing_user:
            raise ValidationError(
                "User with this WhatsApp number already exists",
                error_code="USER_EXISTS"
            )
        
        if user_data.email:
            existing_email_user = await self.get_by_email(user_data.email)
            if existing_email_user:
                raise ValidationError(
                    "User with this email already exists",
                    error_code="EMAIL_EXISTS"
                )
        
        # Create user
        user = await self.create(user_data)
        
        # Send welcome message
        await self.communication_service.send_welcome_message(user.id)
        
        return user
    
    async def get_by_whatsapp(self, whatsapp: str) -> Optional[User]:
        """Get user by WhatsApp number"""
        return self.db.query(User).filter(
            and_(
                User.whatsapp == whatsapp,
                User.is_deleted == False
            )
        ).first()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(
            and_(
                User.email == email,
                User.is_deleted == False
            )
        ).first()
    
    async def search_users(self, query: str, params: UserListParams) -> List[User]:
        """Search users by name, email, or phone"""
        db_query = self.db.query(User).filter(User.is_deleted == False)
        
        # Apply search filter
        if query:
            search_filter = or_(
                User.first_name.ilike(f"%{query}%"),
                User.last_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
                User.whatsapp.ilike(f"%{query}%")
            )
            db_query = db_query.filter(search_filter)
        
        # Apply additional filters
        if params.role:
            db_query = db_query.filter(User.role == params.role)
        
        if params.status:
            db_query = db_query.filter(User.status == params.status)
        
        if params.verified_only:
            db_query = db_query.filter(User.whatsapp_verified == True)
        
        if params.city:
            db_query = db_query.filter(User.city.ilike(f"%{params.city}%"))
        
        if params.country:
            db_query = db_query.filter(User.country.ilike(f"%{params.country}%"))
        
        # Apply pagination
        return db_query.offset(params.offset).limit(params.size).all()
    
    async def update_user(self, user_id: UUID, user_data: UserUpdate) -> User:
        """Update user information"""
        user = await self.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Check email uniqueness if email is being updated
        if user_data.email and user_data.email != user.email:
            existing_user = await self.get_by_email(user_data.email)
            if existing_user:
                raise ValidationError("Email already in use by another user")
        
        return await self.update(user, user_data)
    
    async def change_user_status(self, user_id: UUID, status: UserStatus, reason: str = None) -> User:
        """Change user status"""
        user = await self.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        old_status = user.status
        user.status = status
        
        # Send notification about status change
        if old_status != status:
            await self.communication_service.send_status_change_notification(
                user.id, old_status, status, reason
            )
        
        self.db.flush()
        return user
    
    async def update_last_login(self, user_id: UUID) -> User:
        """Update user's last login timestamp"""
        user = await self.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.last_login_at = datetime.utcnow()
        user.login_count = str(int(user.login_count) + 1)
        
        self.db.flush()
        return user
    
    # OTP Management
    async def generate_otp(self, otp_request: OTPRequest) -> str:
        """Generate and send OTP"""
        # Generate OTP code
        otp_code = self._generate_otp_code()
        
        # Check rate limiting
        await self._check_otp_rate_limit(otp_request.contact, otp_request.contact_type)
        
        # Find or create user for registration OTP
        user = None
        if otp_request.purpose == "registration":
            if otp_request.contact_type in ["whatsapp", "sms"]:
                user = await self.get_by_whatsapp(otp_request.contact)
            else:
                user = await self.get_by_email(otp_request.contact)
        else:
            # For login/verification, user must exist
            if otp_request.contact_type in ["whatsapp", "sms"]:
                user = await self.get_by_whatsapp(otp_request.contact)
            else:
                user = await self.get_by_email(otp_request.contact)
            
            if not user:
                raise NotFoundError("User not found")
        
        # Create OTP record
        otp_record = UserOTP(
            user_id=user.id if user else None,
            contact=otp_request.contact,
            otp_code=otp_code,
            contact_type=ContactType(otp_request.contact_type),
            purpose=otp_request.purpose,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
            last_sent_at=datetime.utcnow()
        )
        
        self.db.add(otp_record)
        self.db.flush()
        
        # Send OTP via appropriate channel
        await self.communication_service.send_otp(
            otp_request.contact,
            otp_code,
            otp_request.contact_type,
            otp_request.purpose
        )
        
        return "OTP sent successfully"
    
    async def verify_otp(self, otp_verify: OTPVerify) -> Dict[str, Any]:
        """Verify OTP code"""
        # Find OTP record
        otp_record = self.db.query(UserOTP).filter(
            and_(
                UserOTP.contact == otp_verify.contact,
                UserOTP.purpose == otp_verify.purpose,
                UserOTP.verified_at.is_(None),
                UserOTP.is_deleted == False
            )
        ).order_by(UserOTP.created_at.desc()).first()
        
        if not otp_record:
            raise ValidationError("OTP not found or already verified")
        
        if otp_record.is_expired:
            raise ValidationError("OTP has expired")
        
        if not otp_record.can_retry:
            raise ValidationError("Maximum verification attempts exceeded")
        
        # Verify OTP code
        if otp_record.otp_code != otp_verify.otp_code:
            otp_record.attempts += 1
            self.db.flush()
            raise ValidationError("Invalid OTP code")
        
        # Mark OTP as verified
        otp_record.verified_at = datetime.utcnow()
        
        # Update user verification status
        if otp_record.user_id:
            user = await self.get(otp_record.user_id)
            if user:
                if otp_record.contact_type == ContactType.WHATSAPP:
                    user.whatsapp_verified = True
                    user.whatsapp_verified_at = datetime.utcnow()
                elif otp_record.contact_type == ContactType.EMAIL:
                    user.email_verified = True
                    user.email_verified_at = datetime.utcnow()
                
                # Update status if needed
                if user.status == UserStatus.PENDING_VERIFICATION and user.is_verified:
                    user.status = UserStatus.ACTIVE
        
        self.db.flush()
        
        return {
            "verified": True,
            "user_id": otp_record.user_id,
            "purpose": otp_record.purpose
        }
    
    def _generate_otp_code(self) -> str:
        """Generate random OTP code"""
        if settings.ENVIRONMENT == "development":
            return "123456"  # Fixed OTP for development
        
        # Generate 6-digit numeric OTP
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    async def _check_otp_rate_limit(self, contact: str, contact_type: str):
        """Check OTP rate limiting"""
        # Check if OTP was sent recently
        recent_otp = self.db.query(UserOTP).filter(
            and_(
                UserOTP.contact == contact,
                UserOTP.contact_type == ContactType(contact_type),
                UserOTP.last_sent_at > datetime.utcnow() - timedelta(minutes=1)
            )
        ).first()
        
        if recent_otp:
            raise ValidationError(
                "OTP was sent recently. Please wait before requesting again.",
                error_code="RATE_LIMITED"
            )
        
        # Check daily limit
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_count = self.db.query(UserOTP).filter(
            and_(
                UserOTP.contact == contact,
                UserOTP.contact_type == ContactType(contact_type),
                UserOTP.created_at >= today_start
            )
        ).count()
        
        if daily_count >= settings.OTP_DAILY_LIMIT:
            raise ValidationError(
                "Daily OTP limit exceeded. Please try again tomorrow.",
                error_code="DAILY_LIMIT_EXCEEDED"
            )
    
    async def get_user_stats(self, user_id: UUID) -> Dict[str, Any]:
        """Get user statistics"""
        user = await self.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        stats = {
            "total_bookings": 0,
            "active_bookings": 0,
            "completed_bookings": 0,
            "cancelled_bookings": 0,
            "total_spent": 0,
            "reviews_given": 0,
            "average_rating_given": 0
        }
        
        # Get booking statistics (would need booking service)
        # This is a placeholder - implement with actual booking queries
        
        return stats
    
    async def get_user_preferences(self, user_id: UUID) -> Dict[str, Any]:
        """Get user preferences"""
        user = await self.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        return user.preferences
    
    async def update_user_preferences(self, user_id: UUID, preferences: Dict[str, Any]) -> User:
        """Update user preferences"""
        user = await self.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Merge with existing preferences
        current_preferences = user.preferences.copy()
        current_preferences.update(preferences)
        user.preferences = current_preferences
        
        self.db.flush()
        return user
```

---

## 🏢 Provider Service (app/services/providers.py)

```python
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.services.base import BaseService, ValidationError, NotFoundError, BusinessLogicError, PermissionError
from app.models.providers import Provider, ProviderDocument, ProviderStatus, BusinessType
from app.models.users import User, UserRole
from app.schemas.providers import ProviderCreate, ProviderUpdate, ProviderListParams, DocumentUpload
from app.services.storage import StorageService
from app.services.communication import CommunicationService

class ProviderService(BaseService[Provider, ProviderCreate, ProviderUpdate]):
    """Provider management service"""
    
    def __init__(self, db: Session):
        super().__init__(Provider, db)
        self.storage_service = StorageService()
        self.communication_service = CommunicationService(db)
    
    async def create_provider_profile(self, user_id: UUID, provider_data: ProviderCreate) -> Provider:
        """Create a new provider profile"""
        # Check if user exists and has appropriate role
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")
        
        if user.role not in [UserRole.PROVIDER, UserRole.ADMIN]:
            raise PermissionError("User must have provider role")
        
        # Check if provider profile already exists
        existing_provider = self.db.query(Provider).filter(
            Provider.user_id == user_id
        ).first()
        if existing_provider:
            raise ValidationError("Provider profile already exists for this user")
        
        # Check business name uniqueness
        existing_business = self.db.query(Provider).filter(
            and_(
                Provider.business_name == provider_data.business_name,
                Provider.is_deleted == False
            )
        ).first()
        if existing_business:
            raise ValidationError("Business name already exists")
        
        # Create provider profile
        provider = await self.create(provider_data, user_id=user_id)
        
        # Send welcome message
        await self.communication_service.send_provider_welcome_message(provider.id)
        
        return provider
    
    async def get_by_user_id(self, user_id: UUID) -> Optional[Provider]:
        """Get provider by user ID"""
        return self.db.query(Provider).filter(
            and_(
                Provider.user_id == user_id,
                Provider.is_deleted == False
            )
        ).first()
    
    async def search_providers(self, params: ProviderListParams) -> List[Provider]:
        """Search providers with filters"""
        query = self.db.query(Provider).filter(Provider.is_deleted == False)
        
        # Apply filters
        if params.status:
            query = query.filter(Provider.verification_status == params.status)
        
        if params.business_type:
            query = query.filter(Provider.business_type == params.business_type)
        
        if params.city:
            query = query.filter(Provider.city.ilike(f"%{params.city}%"))
        
        if params.region:
            query = query.filter(Provider.region.ilike(f"%{params.region}%"))
        
        if params.country:
            query = query.filter(Provider.country.ilike(f"%{params.country}%"))
        
        if params.service_category:
            query = query.filter(Provider.service_categories.contains([params.service_category]))
        
        if params.min_rating:
            query = query.filter(Provider.average_rating >= params.min_rating)
        
        if params.verified_only:
            query = query.filter(Provider.verification_status == ProviderStatus.VERIFIED)
        
        if params.search:
            search_filter = or_(
                Provider.business_name.ilike(f"%{params.search}%"),
                Provider.business_description.ilike(f"%{params.search}%")
            )
            query = query.filter(search_filter)
        
        # Apply ordering
        query = query.order_by(Provider.created_at.desc())
        
        # Apply pagination
        return query.offset(params.offset).limit(params.size).all()
    
    async def update_provider_profile(self, provider_id: UUID, provider_data: ProviderUpdate, user_id: UUID = None) -> Provider:
        """Update provider profile"""
        provider = await self.get(provider_id)
        if not provider:
            raise NotFoundError("Provider not found")
        
        # Check permission
        if user_id and provider.user_id != user_id:
            raise PermissionError("Not authorized to update this provider")
        
        # Check business name uniqueness if being updated
        if provider_data.business_name and provider_data.business_name != provider.business_name:
            existing_business = self.db.query(Provider).filter(
                and_(
                    Provider.business_name == provider_data.business_name,
                    Provider.id != provider_id,
                    Provider.is_deleted == False
                )
            ).first()
            if existing_business:
                raise ValidationError("Business name already exists")
        
        return await self.update(provider, provider_data)
    
    async def update_verification_status(
        self,
        provider_id: UUID,
        status: ProviderStatus,
        notes: str = None,
        verified_by: UUID = None
    ) -> Provider:
        """Update provider verification status (admin only)"""
        provider = await self.get(provider_id)
        if not provider:
            raise NotFoundError("Provider not found")
        
        old_status = provider.verification_status
        provider.verification_status = status
        provider.verification_notes = notes
        
        if status == ProviderStatus.VERIFIED:
            provider.verification_date = datetime.utcnow()
        
        # Send notification
        if old_status != status:
            await self.communication_service.send_verification_status_update(
                provider.id, old_status, status, notes
            )
        
        self.db.flush()
        return provider
    
    async def upload_document(
        self,
        provider_id: UUID,
        document_data: DocumentUpload,
        file_content: bytes,
        user_id: UUID = None
    ) -> ProviderDocument:
        """Upload provider verification document"""
        provider = await self.get(provider_id)
        if not provider:
            raise NotFoundError("Provider not found")
        
        # Check permission
        if user_id and provider.user_id != user_id:
            raise PermissionError("Not authorized to upload documents for this provider")
        
        # Upload file to storage
        file_url = await self.storage_service.upload_file(
            file_content,
            f"providers/{provider_id}/documents/{document_data.original_filename}",
            document_data.mime_type
        )
        
        # Create document record
        document = ProviderDocument(
            provider_id=provider_id,
            document_type=document_data.document_type,
            document_url=file_url,
            original_filename=document_data.original_filename,
            file_size=document_data.file_size,
            mime_type=document_data.mime_type,
            expires_at=document_data.expires_at
        )
        
        self.db.add(document)
        self.db.flush()
        
        return document
    
    async def verify_document(
        self,
        document_id: UUID,
        status: str,
        notes: str = None,
        verified_by: UUID = None
    ) -> ProviderDocument:
        """Verify provider document (admin only)"""
        document = self.db.query(ProviderDocument).filter(
            ProviderDocument.id == document_id
        ).first()
        
        if not document:
            raise NotFoundError("Document not found")
        
        document.verification_status = status
        document.verification_notes = notes
        document.verified_by = verified_by
        document.verified_at = datetime.utcnow()
        
        self.db.flush()
        
        # Check if all required documents are verified
        await self._check_provider_verification_completion(document.provider_id)
        
        return document
    
    async def get_provider_documents(self, provider_id: UUID, user_id: UUID = None) -> List[ProviderDocument]:
        """Get provider documents"""
        provider = await self.get(provider_id)
        if not provider:
            raise NotFoundError("Provider not found")
        
        # Check permission for non-public information
        if user_id and provider.user_id != user_id:
            # Return limited information for non-owners
            pass
        
        return self.db.query(ProviderDocument).filter(
            and_(
                ProviderDocument.provider_id == provider_id,
                ProviderDocument.is_deleted == False
            )
        ).all()
    
    async def update_business_metrics(self, provider_id: UUID, metrics: Dict[str, Any]) -> Provider:
        """Update provider business metrics"""
        provider = await self.get(provider_id)
        if not provider:
            raise NotFoundError("Provider not found")
        
        # Update metrics
        if 'total_bookings' in metrics:
            provider.total_bookings = metrics['total_bookings']
        
        if 'successful_bookings' in metrics:
            provider.successful_bookings = metrics['successful_bookings']
        
        if 'cancelled_bookings' in metrics:
            provider.cancelled_bookings = metrics['cancelled_bookings']
        
        if 'average_rating' in metrics:
            provider.average_rating = Decimal(str(metrics['average_rating']))
        
        if 'total_reviews' in metrics:
            provider.total_reviews = metrics['total_reviews']
        
        if 'response_rate' in metrics:
            provider.response_rate = Decimal(str(metrics['response_rate']))
        
        if 'response_time_hours' in metrics:
            provider.response_time_hours = Decimal(str(metrics['response_time_hours']))
        
        self.db.flush()
        return provider
    
    async def get_provider_stats(self, provider_id: UUID) -> Dict[str, Any]:
        """Get provider statistics"""
        provider = await self.get(provider_id)
        if not provider:
            raise NotFoundError("Provider not found")
        
        # Calculate additional statistics
        stats = {
            "total_services": 0,
            "active_services": 0,
            "total_bookings": provider.total_bookings,
            "successful_bookings": provider.successful_bookings,
            "cancelled_bookings": provider.cancelled_bookings,
            "success_rate": provider.success_rate,
            "cancellation_rate": provider.cancellation_rate,
            "average_rating": float(provider.average_rating),
            "total_reviews": provider.total_reviews,
            "response_rate": float(provider.response_rate),
            "response_time_hours": float(provider.response_time_hours),
            "revenue_this_month": 0,
            "revenue_total": 0,
            "commission_pending": 0
        }
        
        # Add service statistics (would need service queries)
        # Add financial statistics (would need payment/booking queries)
        
        return stats
    
    async def _check_provider_verification_completion(self, provider_id: UUID):
        """Check if provider has all required documents verified"""
        provider = await self.get(provider_id)
        if not provider:
            return
        
        # Define required documents based on business type
        required_docs = {
            BusinessType.INDIVIDUAL: ['id_card'],
            BusinessType.COMPANY: ['business_license', 'tax_certificate'],
            BusinessType.AGENCY: ['business_license', 'tax_certificate', 'insurance'],
            BusinessType.GOVERNMENT: ['government_authorization']
        }
        
        required_doc_types = required_docs.get(provider.business_type, ['id_card'])
        
        # Check if all required documents are verified
        verified_docs = self.db.query(ProviderDocument).filter(
            and_(
                ProviderDocument.provider_id == provider_id,
                ProviderDocument.document_type.in_(required_doc_types),
                ProviderDocument.verification_status == 'verified',
                ProviderDocument.is_deleted == False
            )
        ).all()
        
        verified_doc_types = [doc.document_type for doc in verified_docs]
        
        # Update verification status if all documents are verified
        if all(doc_type in verified_doc_types for doc_type in required_doc_types):
            if provider.verification_status == ProviderStatus.UNDER_REVIEW:
                provider.verification_status = ProviderStatus.VERIFIED
                provider.verification_date = datetime.utcnow()
                
                # Send verification completion notification
                await self.communication_service.send_verification_completed_notification(provider.id)
        
        self.db.flush()
```

This completes the foundation service layer implementation. Let me continue with the remaining services (Service, Booking, Payment services) in the next part.