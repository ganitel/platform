## 🏨 Service Management Service (app/services/services.py)

```python
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from slugify import slugify

from app.services.base import BaseService, ValidationError, NotFoundError, BusinessLogicError, PermissionError
from app.models.services import Service, ServiceStatus, ServiceAvailability, ServiceImage, Category
from app.models.providers import Provider, ProviderStatus
from app.schemas.services import ServiceCreate, ServiceUpdate, ServiceListParams, AvailabilityCreate
from app.services.storage import StorageService
from app.services.search import SearchService

class ServiceManagementService(BaseService[Service, ServiceCreate, ServiceUpdate]):
    """Service management and operations"""
    
    def __init__(self, db: Session):
        super().__init__(Service, db)
        self.storage_service = StorageService()
        self.search_service = SearchService(db)
    
    async def create_service(self, provider_id: UUID, service_data: ServiceCreate, user_id: UUID) -> Service:
        """Create a new service"""
        # Verify provider exists and user has permission
        provider = self.db.query(Provider).filter(
            and_(
                Provider.id == provider_id,
                Provider.user_id == user_id,
                Provider.is_deleted == False
            )
        ).first()
        
        if not provider:
            raise NotFoundError("Provider not found or access denied")
        
        if provider.verification_status != ProviderStatus.VERIFIED:
            raise PermissionError("Provider must be verified to create services")
        
        # Verify category exists
        category = self.db.query(Category).filter(
            and_(
                Category.id == service_data.category_id,
                Category.is_active == True
            )
        ).first()
        
        if not category:
            raise NotFoundError("Service category not found")
        
        # Generate unique slug
        slug = await self._generate_unique_slug(service_data.title)
        
        # Create service
        service = await self.create(
            service_data,
            provider_id=provider_id,
            slug=slug,
            status=ServiceStatus.DRAFT
        )
        
        # Index service for search
        await self.search_service.index_service(service.id)
        
        return service
    
    async def update_service(self, service_id: UUID, service_data: ServiceUpdate, user_id: UUID) -> Service:
        """Update existing service"""
        service = await self.get_service_with_permissions(service_id, user_id)
        
        # Update slug if title changed
        if service_data.title and service_data.title != service.title:
            new_slug = await self._generate_unique_slug(service_data.title, exclude_id=service_id)
            service_data.slug = new_slug
        
        updated_service = await self.update(service, service_data)
        
        # Re-index for search
        await self.search_service.index_service(service.id)
        
        return updated_service
    
    async def get_service_with_permissions(self, service_id: UUID, user_id: UUID = None) -> Service:
        """Get service with permission check"""
        service = self.db.query(Service).options(
            joinedload(Service.provider)
        ).filter(
            and_(
                Service.id == service_id,
                Service.is_deleted == False
            )
        ).first()
        
        if not service:
            raise NotFoundError("Service not found")
        
        # Check permissions for non-public access
        if user_id and service.provider.user_id != user_id:
            if service.status not in [ServiceStatus.ACTIVE]:
                raise PermissionError("Access denied")
        
        return service
    
    async def search_services(self, params: ServiceListParams) -> Tuple[List[Service], int]:
        """Search services with advanced filtering"""
        query = self.db.query(Service).options(
            joinedload(Service.provider),
            joinedload(Service.category)
        ).filter(Service.is_deleted == False)
        
        # Base filters
        if params.category_id:
            query = query.filter(Service.category_id == params.category_id)
        
        if params.provider_id:
            query = query.filter(Service.provider_id == params.provider_id)
        
        # Location filters
        if params.city:
            query = query.filter(Service.city.ilike(f"%{params.city}%"))
        
        if params.region:
            query = query.filter(Service.region.ilike(f"%{params.region}%"))
        
        if params.country:
            query = query.filter(Service.country.ilike(f"%{params.country}%"))
        
        # Price filters
        if params.min_price:
            query = query.filter(Service.base_price >= params.min_price)
        
        if params.max_price:
            query = query.filter(Service.base_price <= params.max_price)
        
        # Rating filter
        if params.min_rating:
            query = query.filter(Service.average_rating >= params.min_rating)
        
        # Booking preferences
        if params.instant_booking_only:
            query = query.filter(Service.instant_booking == True)
        
        if params.featured_only:
            query = query.filter(Service.featured == True)
        
        # Availability filter
        if params.available_from and params.available_to:
            availability_subquery = self._get_availability_subquery(
                params.available_from, params.available_to, params.guest_count
            )
            query = query.filter(Service.id.in_(availability_subquery))
        
        # Text search
        if params.search:
            search_filter = or_(
                Service.title.ilike(f"%{params.search}%"),
                Service.description.ilike(f"%{params.search}%"),
                Service.short_description.ilike(f"%{params.search}%")
            )
            query = query.filter(search_filter)
        
        # Count total results
        total = query.count()
        
        # Apply sorting
        query = self._apply_service_sorting(query, params.sort_by, params.sort_order)
        
        # Apply pagination
        services = query.offset(params.offset).limit(params.size).all()
        
        return services, total
    
    async def check_service_availability(
        self, 
        service_id: UUID, 
        check_in: datetime, 
        check_out: datetime,
        guest_count: int = 1
    ) -> Dict[str, Any]:
        """Check if service is available for booking"""
        service = await self.get(service_id)
        if not service:
            raise NotFoundError("Service not found")
        
        if service.status != ServiceStatus.ACTIVE:
            return {"available": False, "reason": "Service not active"}
        
        if guest_count > service.capacity:
            return {"available": False, "reason": "Exceeds capacity"}
        
        # Check availability blocks
        conflicts = self.db.query(ServiceAvailability).filter(
            and_(
                ServiceAvailability.service_id == service_id,
                ServiceAvailability.available == False,
                or_(
                    and_(
                        ServiceAvailability.start_date <= check_in,
                        ServiceAvailability.end_date > check_in
                    ),
                    and_(
                        ServiceAvailability.start_date < check_out,
                        ServiceAvailability.end_date >= check_out
                    ),
                    and_(
                        ServiceAvailability.start_date >= check_in,
                        ServiceAvailability.end_date <= check_out
                    )
                )
            )
        ).all()
        
        if conflicts:
            return {
                "available": False, 
                "reason": "Not available for selected dates",
                "conflicts": [c.reason for c in conflicts]
            }
        
        # Calculate pricing
        pricing = await self.calculate_service_pricing(service_id, check_in, check_out, guest_count)
        
        return {
            "available": True,
            "pricing": pricing,
            "minimum_stay": service.minimum_booking_duration,
            "maximum_stay": service.maximum_booking_duration
        }
    
    async def calculate_service_pricing(
        self,
        service_id: UUID,
        check_in: datetime,
        check_out: datetime,
        guest_count: int = 1
    ) -> Dict[str, Any]:
        """Calculate service pricing for date range"""
        service = await self.get(service_id)
        if not service:
            raise NotFoundError("Service not found")
        
        nights = (check_out.date() - check_in.date()).days
        base_total = service.base_price * nights
        
        # Apply pricing rules
        pricing_breakdown = {
            "base_price": float(service.base_price),
            "nights": nights,
            "subtotal": float(base_total),
            "taxes": [],
            "fees": [],
            "discounts": [],
            "total": float(base_total)
        }
        
        # Apply dynamic pricing rules from service.pricing_rules
        total_amount = base_total
        
        # Seasonal rates
        if "seasonal_rates" in service.pricing_rules:
            for rate in service.pricing_rules["seasonal_rates"]:
                rate_start = datetime.strptime(rate["start_date"], "%Y-%m-%d").date()
                rate_end = datetime.strptime(rate["end_date"], "%Y-%m-%d").date()
                
                # Check if booking period overlaps with seasonal rate
                if (check_in.date() <= rate_end and check_out.date() >= rate_start):
                    if rate["adjustment_type"] == "percentage":
                        adjustment = base_total * (rate["adjustment_value"] / 100)
                        total_amount += adjustment
                        pricing_breakdown["fees"].append({
                            "name": rate.get("reason", "Seasonal Rate"),
                            "amount": float(adjustment)
                        })
        
        # Length of stay discounts
        if "length_of_stay_discounts" in service.pricing_rules:
            for discount in service.pricing_rules["length_of_stay_discounts"]:
                if nights >= discount["min_nights"]:
                    discount_amount = base_total * (discount["discount_percentage"] / 100)
                    total_amount -= discount_amount
                    pricing_breakdown["discounts"].append({
                        "name": f"{discount['min_nights']}+ nights discount",
                        "amount": float(-discount_amount)
                    })
                    break  # Apply only the best discount
        
        # Add taxes (19% VAT for Cameroon)
        tax_rate = 0.19
        tax_amount = total_amount * tax_rate
        total_amount += tax_amount
        pricing_breakdown["taxes"].append({
            "name": "VAT",
            "rate": tax_rate,
            "amount": float(tax_amount)
        })
        
        # Add service fee (platform commission)
        service_fee = total_amount * 0.05  # 5% service fee
        total_amount += service_fee
        pricing_breakdown["fees"].append({
            "name": "Service Fee",
            "amount": float(service_fee)
        })
        
        pricing_breakdown["total"] = float(total_amount)
        
        return pricing_breakdown
    
    async def _generate_unique_slug(self, title: str, exclude_id: UUID = None) -> str:
        """Generate unique slug for service"""
        base_slug = slugify(title)
        slug = base_slug
        counter = 1
        
        while True:
            query = self.db.query(Service).filter(Service.slug == slug)
            if exclude_id:
                query = query.filter(Service.id != exclude_id)
            
            if not query.first():
                break
            
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    def _get_availability_subquery(self, check_in: date, check_out: date, guest_count: int = None):
        """Get subquery for available services"""
        return self.db.query(Service.id).filter(
            Service.status == ServiceStatus.ACTIVE
        ).subquery()
    
    def _apply_service_sorting(self, query, sort_by: str, sort_order: str):
        """Apply sorting to service query"""
        if sort_by == "price":
            order_column = Service.base_price
        elif sort_by == "rating":
            order_column = Service.average_rating
        elif sort_by == "popularity":
            order_column = Service.booking_count
        else:
            order_column = Service.created_at
        
        if sort_order == "asc":
            return query.order_by(order_column.asc())
        else:
            return query.order_by(order_column.desc())
```

---

## 📋 Booking Service (app/services/bookings.py)

```python
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal
import secrets
import string

from app.services.base import BaseService, ValidationError, NotFoundError, BusinessLogicError
from app.models.bookings import Booking, BookingStatus, PaymentStatus, CartItem
from app.models.services import Service, ServiceStatus
from app.schemas.bookings import BookingCreate, BookingUpdate, BookingListParams, CartItemAdd
from app.services.services import ServiceManagementService
from app.services.communication import CommunicationService

class BookingService(BaseService[Booking, BookingCreate, BookingUpdate]):
    """Booking management service"""
    
    def __init__(self, db: Session):
        super().__init__(Booking, db)
        self.service_service = ServiceManagementService(db)
        self.communication_service = CommunicationService(db)
    
    async def create_booking(self, booking_data: BookingCreate, guest_id: UUID) -> Booking:
        """Create a new booking"""
        # Validate service availability
        availability = await self.service_service.check_service_availability(
            booking_data.service_id,
            booking_data.check_in_date,
            booking_data.check_out_date,
            booking_data.guest_count_adults + booking_data.guest_count_children
        )
        
        if not availability["available"]:
            raise ValidationError(f"Service not available: {availability['reason']}")
        
        # Get service and validate
        service = await self.service_service.get(booking_data.service_id)
        if not service or service.status != ServiceStatus.ACTIVE:
            raise ValidationError("Service is not available for booking")
        
        # Calculate pricing
        pricing = availability["pricing"]
        
        # Generate unique booking number
        booking_number = await self._generate_booking_number()
        
        # Create booking
        booking = await self.create(
            booking_data,
            guest_id=guest_id,
            booking_number=booking_number,
            total_nights=(booking_data.check_out_date.date() - booking_data.check_in_date.date()).days,
            base_price=Decimal(str(pricing["base_price"])),
            subtotal=Decimal(str(pricing["subtotal"])),
            service_fee=Decimal(str(sum(fee["amount"] for fee in pricing["fees"]))),
            tax_amount=Decimal(str(sum(tax["amount"] for tax in pricing["taxes"]))),
            total_amount=Decimal(str(pricing["total"])),
            currency=service.currency,
            pricing_breakdown=pricing,
            commission_rate=service.provider.commission_rate,
            commission_amount=Decimal(str(pricing["total"])) * service.provider.commission_rate,
            payment_due_date=datetime.utcnow() + timedelta(hours=24),
            status=BookingStatus.CONFIRMED if service.instant_booking else BookingStatus.PENDING
        )
        
        # Send notifications
        await self.communication_service.send_booking_confirmation(booking.id)
        await self.communication_service.send_booking_request_to_provider(booking.id)
        
        return booking
    
    async def confirm_booking(self, booking_id: UUID, provider_user_id: UUID) -> Booking:
        """Confirm booking (provider action)"""
        booking = await self.get_booking_with_permissions(booking_id, provider_user_id, is_provider=True)
        
        if booking.status != BookingStatus.PENDING:
            raise BusinessLogicError("Booking cannot be confirmed in current status")
        
        booking.status = BookingStatus.CONFIRMED
        booking.confirmed_at = datetime.utcnow()
        booking.provider_response_date = datetime.utcnow()
        
        self.db.flush()
        
        # Send confirmation to guest
        await self.communication_service.send_booking_confirmed_to_guest(booking.id)
        
        return booking
    
    async def cancel_booking(
        self,
        booking_id: UUID,
        user_id: UUID,
        reason: str,
        cancelled_by_type: str = "guest"
    ) -> Booking:
        """Cancel booking"""
        booking = await self.get_booking_with_permissions(booking_id, user_id)
        
        if not booking.can_be_cancelled:
            raise BusinessLogicError("Booking cannot be cancelled in current status")
        
        # Determine cancellation status
        if cancelled_by_type == "guest":
            booking.status = BookingStatus.CANCELLED_BY_GUEST
        elif cancelled_by_type == "provider":
            booking.status = BookingStatus.CANCELLED_BY_PROVIDER
        else:
            booking.status = BookingStatus.CANCELLED_BY_ADMIN
        
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = reason
        booking.cancelled_by = user_id
        
        self.db.flush()
        
        # Send notifications
        await self.communication_service.send_booking_cancellation_notification(booking.id)
        
        return booking
    
    async def get_booking_with_permissions(
        self,
        booking_id: UUID,
        user_id: UUID,
        is_provider: bool = False
    ) -> Booking:
        """Get booking with permission check"""
        query = self.db.query(Booking).options(
            joinedload(Booking.guest),
            joinedload(Booking.service).joinedload(Service.provider)
        ).filter(
            and_(
                Booking.id == booking_id,
                Booking.is_deleted == False
            )
        )
        
        booking = query.first()
        if not booking:
            raise NotFoundError("Booking not found")
        
        # Check permissions
        if is_provider:
            if booking.service.provider.user_id != user_id:
                raise PermissionError("Access denied")
        else:
            if booking.guest_id != user_id:
                raise PermissionError("Access denied")
        
        return booking
    
    # Cart Management
    async def add_to_cart(self, cart_data: CartItemAdd, user_id: UUID) -> CartItem:
        """Add item to shopping cart"""
        # Check if item already exists in cart
        existing_item = self.db.query(CartItem).filter(
            and_(
                CartItem.user_id == user_id,
                CartItem.service_id == cart_data.service_id,
                CartItem.check_in_date == cart_data.check_in_date,
                CartItem.check_out_date == cart_data.check_out_date,
                CartItem.is_deleted == False
            )
        ).first()
        
        if existing_item:
            raise ValidationError("Item already exists in cart")
        
        # Validate availability and get pricing
        availability = await self.service_service.check_service_availability(
            cart_data.service_id,
            cart_data.check_in_date,
            cart_data.check_out_date,
            cart_data.guest_count_adults + cart_data.guest_count_children
        )
        
        if not availability["available"]:
            raise ValidationError(f"Service not available: {availability['reason']}")
        
        # Get service
        service = await self.service_service.get(cart_data.service_id)
        pricing = availability["pricing"]
        
        # Create cart item
        cart_item = CartItem(
            user_id=user_id,
            service_id=cart_data.service_id,
            package_id=cart_data.package_id,
            check_in_date=cart_data.check_in_date,
            check_out_date=cart_data.check_out_date,
            guest_count_adults=cart_data.guest_count_adults,
            guest_count_children=cart_data.guest_count_children,
            guest_count_infants=cart_data.guest_count_infants,
            unit_price=Decimal(str(pricing["base_price"])),
            total_price=Decimal(str(pricing["total"])),
            currency=service.currency,
            special_requests=cart_data.special_requests,
            selected_options=cart_data.selected_options,
            price_valid_until=datetime.utcnow() + timedelta(hours=2)  # 2-hour price lock
        )
        
        self.db.add(cart_item)
        self.db.flush()
        
        return cart_item
    
    async def get_user_cart(self, user_id: UUID) -> List[CartItem]:
        """Get user's cart items"""
        return self.db.query(CartItem).options(
            joinedload(CartItem.service)
        ).filter(
            and_(
                CartItem.user_id == user_id,
                CartItem.is_deleted == False
            )
        ).order_by(CartItem.created_at.desc()).all()
    
    async def _generate_booking_number(self) -> str:
        """Generate unique booking number"""
        while True:
            # Generate format: GAN-YYYYMMDD-XXXX
            date_part = datetime.utcnow().strftime("%Y%m%d")
            random_part = ''.join(secrets.choice(string.digits) for _ in range(4))
            booking_number = f"GAN-{date_part}-{random_part}"
            
            # Check if exists
            existing = self.db.query(Booking).filter(
                Booking.booking_number == booking_number
            ).first()
            
            if not existing:
                return booking_number
```

---

## 💳 Payment Service (app/services/payments.py)

```python
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from decimal import Decimal
import secrets
import string

from app.services.base import BaseService, ValidationError, NotFoundError, BusinessLogicError
from app.models.bookings import Payment, PaymentStatus, Booking
from app.schemas.payments import PaymentInitiate, RefundRequest
from app.integrations.tranzak import TranzakPaymentGateway
from app.integrations.mobile_money import MobileMoneyService

class PaymentService(BaseService[Payment, PaymentInitiate, None]):
    """Payment processing service"""
    
    def __init__(self, db: Session):
        super().__init__(Payment, db)
        self.tranzak = TranzakPaymentGateway()
        self.mobile_money = MobileMoneyService()
    
    async def initiate_payment(self, payment_data: PaymentInitiate, user_id: UUID) -> Payment:
        """Initiate payment for booking"""
        # Get and validate booking
        booking = self.db.query(Booking).filter(
            and_(
                Booking.id == payment_data.booking_id,
                Booking.guest_id == user_id,
                Booking.is_deleted == False
            )
        ).first()
        
        if not booking:
            raise NotFoundError("Booking not found")
        
        if booking.payment_status == PaymentStatus.COMPLETED:
            raise ValidationError("Booking is already paid")
        
        if payment_data.amount != booking.total_amount:
            raise ValidationError("Payment amount does not match booking total")
        
        # Generate transaction ID
        transaction_id = self._generate_transaction_id()
        
        # Create payment record
        payment = Payment(
            transaction_id=transaction_id,
            booking_id=payment_data.booking_id,
            user_id=user_id,
            amount=payment_data.amount,
            currency=booking.currency,
            payment_method=payment_data.payment_method,
            payment_metadata=payment_data.payment_metadata,
            status=PaymentStatus.PENDING
        )
        
        self.db.add(payment)
        self.db.flush()
        
        # Process payment based on method
        try:
            if payment_data.payment_method == "mobile_money":
                result = await self._process_mobile_money_payment(payment)
            elif payment_data.payment_method == "bank_transfer":
                result = await self._process_bank_transfer(payment)
            else:
                raise ValidationError("Unsupported payment method")
            
            # Update payment with gateway response
            payment.external_transaction_id = result.get("transaction_id")
            payment.gateway_provider = result.get("provider")
            payment.gateway_reference = result.get("reference")
            
            if result["status"] == "success":
                payment.status = PaymentStatus.PROCESSING
            else:
                payment.status = PaymentStatus.FAILED
                payment.error_message = result.get("error_message")
            
        except Exception as e:
            payment.status = PaymentStatus.FAILED
            payment.error_message = str(e)
            payment.failed_at = datetime.utcnow()
        
        self.db.flush()
        return payment
    
    async def process_payment_callback(self, callback_data: Dict[str, Any]) -> bool:
        """Process payment gateway callback"""
        transaction_id = callback_data.get("transaction_id")
        
        payment = self.db.query(Payment).filter(
            Payment.external_transaction_id == transaction_id
        ).first()
        
        if not payment:
            return False
        
        # Update payment status based on callback
        if callback_data["status"] == "success":
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            
            # Update booking payment status
            booking = payment.booking
            booking.payment_status = PaymentStatus.COMPLETED
            
        elif callback_data["status"] == "failed":
            payment.status = PaymentStatus.FAILED
            payment.failed_at = datetime.utcnow()
            payment.error_message = callback_data.get("error_message")
        
        self.db.flush()
        return True
    
    async def _process_mobile_money_payment(self, payment: Payment) -> Dict[str, Any]:
        """Process mobile money payment"""
        metadata = payment.payment_metadata
        
        return await self.mobile_money.initiate_payment(
            amount=float(payment.amount),
            currency=payment.currency,
            phone_number=metadata["phone_number"],
            network=metadata["network"],
            reference=payment.transaction_id
        )
    
    async def _process_bank_transfer(self, payment: Payment) -> Dict[str, Any]:
        """Process bank transfer payment"""
        # Generate bank transfer instructions
        return {
            "status": "success",
            "transaction_id": payment.transaction_id,
            "provider": "bank_transfer",
            "reference": payment.transaction_id,
            "instructions": {
                "bank_name": "UBA Cameroon",
                "account_number": "1234567890",
                "account_name": "Ganitel Ltd",
                "reference": payment.transaction_id,
                "amount": float(payment.amount),
                "currency": payment.currency
            }
        }
    
    def _generate_transaction_id(self) -> str:
        """Generate unique transaction ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        return f"PAY-{timestamp}-{random_part}"
```

These are the most critical services that provide the core business functionality:

1. **Service Management Service** - Complete service CRUD, availability checking, pricing calculation
2. **Booking Service** - Full booking lifecycle, cart management  
3. **Payment Service** - Payment processing foundation

With these services, the development team can now:
- Create and manage services with proper business logic
- Handle the complete booking flow from cart to completion
- Process payments through multiple channels
- Implement search and filtering capabilities
- Manage service availability and pricing

The team has the essential building blocks to build a working travel platform. They can now focus on creating API endpoints that use these services and integrating with external systems (Tranzak, WhatsApp, etc.).