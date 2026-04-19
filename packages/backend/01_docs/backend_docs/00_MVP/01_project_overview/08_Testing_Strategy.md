# ✅ Ganitel V2 — Comprehensive Testing Strategy

This document outlines the complete testing approach for the Ganitel multi-service travel platform, ensuring quality, reliability, and performance across all user journeys and system components.

---

## 🎯 Testing Philosophy & Objectives

### **Core Testing Principles**
- **Quality First**: Every feature must meet quality standards before release
- **User-Centric**: Testing focuses on real user scenarios and journeys
- **Risk-Based**: Higher risk features receive more comprehensive testing
- **Automated-First**: Prefer automation for repetitive and regression testing
- **Continuous**: Testing is integrated throughout the development lifecycle

### **Quality Objectives**
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Code Coverage** | 90%+ | Unit + Integration tests |
| **API Reliability** | 99.9% uptime | End-to-end monitoring |
| **Performance** | <2s response time | Load testing |
| **Security** | Zero critical vulnerabilities | Security scanning |
| **User Experience** | <5% error rate | User journey testing |

---

## 🧪 Testing Pyramid Strategy

### **Test Distribution (Recommended)**
```
           E2E Tests (10%)
         ┌─────────────────┐
        ┌┴─────────────────┴┐
       ┌┴─ Integration (30%) ┴┐
      ┌┴─────────────────────┴┐
     ┌┴──── Unit Tests (60%) ──┴┐
    └─────────────────────────┘
```

### **Testing Levels**

#### **Level 1: Unit Testing (60%)**
- **Scope**: Individual functions, methods, classes
- **Tools**: pytest, unittest.mock, factory_boy
- **Coverage**: Business logic, data validation, utility functions
- **Execution**: Every commit, <30 seconds total

#### **Level 2: Integration Testing (30%)**
- **Scope**: Component interactions, API endpoints, database operations
- **Tools**: pytest, testcontainers, requests
- **Coverage**: Service integrations, external APIs, database queries
- **Execution**: Every pull request, <5 minutes total

#### **Level 3: End-to-End Testing (10%)**
- **Scope**: Complete user journeys, system workflows
- **Tools**: Playwright, pytest-playwright
- **Coverage**: Critical user paths, payment flows, booking processes
- **Execution**: Pre-deployment, <15 minutes total

---

## 🔧 Unit Testing Strategy

### **Framework & Tools**
```python
# Core Testing Stack
pytest>=7.0.0              # Primary testing framework
pytest-asyncio>=0.20.0     # Async test support
pytest-cov>=4.0.0          # Coverage reporting
pytest-mock>=3.10.0        # Mocking utilities
factory-boy>=3.2.0         # Test data factories
faker>=18.0.0               # Fake data generation
```

### **Unit Test Categories**

#### **1. Business Logic Tests**
```python
# Example: Service pricing calculation
class TestServicePricing:
    def test_base_price_calculation(self):
        """Test basic price calculation for service booking"""
        service = ServiceFactory(base_price=100000)
        booking_details = BookingDetailsFactory(nights=3)
        
        calculator = PricingCalculator(service, booking_details)
        result = calculator.calculate_total()
        
        assert result.base_amount == 300000
        assert result.service_fee == 30000  # 10%
        assert result.taxes == 18000  # 6%
        assert result.total == 348000

    def test_seasonal_pricing_adjustment(self):
        """Test seasonal price adjustments"""
        service = ServiceFactory(base_price=100000)
        high_season = date(2025, 12, 25)  # Christmas
        
        calculator = PricingCalculator(service, BookingDetailsFactory(
            start_date=high_season, nights=2
        ))
        result = calculator.calculate_total()
        
        # 25% high season markup
        assert result.base_amount == 250000
```

#### **2. Data Validation Tests**
```python
class TestUserValidation:
    def test_valid_whatsapp_number(self):
        """Test WhatsApp number validation"""
        validator = WhatsAppValidator()
        
        assert validator.is_valid("+237690000000") is True
        assert validator.is_valid("+33123456789") is True
        assert validator.is_valid("invalid") is False
        assert validator.is_valid("") is False

    def test_booking_date_validation(self):
        """Test booking date constraints"""
        validator = BookingValidator()
        today = date.today()
        
        # Valid future date
        assert validator.validate_dates(
            start_date=today + timedelta(days=7),
            end_date=today + timedelta(days=10)
        ).is_valid is True
        
        # Invalid: past date
        assert validator.validate_dates(
            start_date=today - timedelta(days=1),
            end_date=today + timedelta(days=2)
        ).is_valid is False
```

#### **3. Database Model Tests**
```python
class TestServiceModel:
    def test_service_creation(self):
        """Test service model creation and constraints"""
        service = Service.objects.create(
            title="Test Villa",
            category_id="accommodation",
            provider_id=self.provider.id,
            base_price=Decimal("100000.00"),
            currency="XAF"
        )
        
        assert service.slug == "test-villa"
        assert service.status == "draft"
        assert service.created_at is not None

    def test_service_search_functionality(self):
        """Test service search and filtering"""
        # Create test services
        ServiceFactory.create_batch(5, category="accommodation")
        ServiceFactory.create_batch(3, category="vehicle_rental")
        
        # Test category filter
        results = ServiceSearch.search(category="accommodation")
        assert len(results) == 5
        
        # Test price range filter
        results = ServiceSearch.search(
            min_price=50000, 
            max_price=150000
        )
        assert all(50000 <= s.base_price <= 150000 for s in results)
```

### **Test Data Management**
```python
# factories.py - Test data factories
class UserFactory(factory.Factory):
    class Meta:
        model = User
    
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.LazyAttribute(
        lambda obj: f"{obj.first_name.lower()}.{obj.last_name.lower()}@example.com"
    )
    whatsapp = factory.Faker("phone_number")
    role = "traveler"

class ServiceFactory(factory.Factory):
    class Meta:
        model = Service
    
    title = factory.Faker("company")
    description = factory.Faker("text", max_nb_chars=500)
    category = factory.SubFactory(CategoryFactory)
    provider = factory.SubFactory(ProviderFactory)
    base_price = factory.Faker("pydecimal", left_digits=6, right_digits=2, positive=True)
    currency = "XAF"
    capacity = factory.Faker("random_int", min=1, max=10)
```

---

## 🔗 Integration Testing Strategy

### **API Integration Tests**

#### **1. Authentication Flow Tests**
```python
class TestAuthenticationAPI:
    @pytest.mark.asyncio
    async def test_otp_login_flow(self):
        """Test complete OTP authentication flow"""
        client = AsyncTestClient(app)
        
        # Step 1: Request OTP
        response = await client.post("/auth/request-otp", json={
            "contact": "+237690000000",
            "contact_type": "whatsapp",
            "purpose": "login"
        })
        assert response.status_code == 200
        
        # Step 2: Verify OTP (mock)
        with patch('services.otp.OTPService.verify') as mock_verify:
            mock_verify.return_value = True
            
            response = await client.post("/auth/verify-otp", json={
                "contact": "+237690000000",
                "otp": "123456"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data["data"]
            assert "user" in data["data"]

    @pytest.mark.asyncio
    async def test_protected_endpoint_access(self):
        """Test JWT token validation on protected endpoints"""
        client = AsyncTestClient(app)
        user = await UserFactory.create()
        token = create_access_token(user.id)
        
        # Valid token
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Invalid token
        response = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
```

#### **2. Service Management Tests**
```python
class TestServiceAPI:
    @pytest.mark.asyncio
    async def test_service_search_integration(self):
        """Test service search with multiple filters"""
        client = AsyncTestClient(app)
        
        # Create test data
        services = await ServiceFactory.create_batch(10)
        
        # Test basic search
        response = await client.get("/services?category=accommodation")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]["services"]) <= 20  # Default limit
        
        # Test complex filtering
        response = await client.get(
            "/services?category=accommodation&min_price=50000&max_price=200000&city=Yaoundé"
        )
        assert response.status_code == 200
        # Verify filters are applied correctly

    @pytest.mark.asyncio
    async def test_service_availability_check(self):
        """Test availability checking integration"""
        client = AsyncTestClient(app)
        service = await ServiceFactory.create()
        
        response = await client.get(
            f"/services/{service.id}/availability",
            params={
                "start_date": "2025-10-15",
                "end_date": "2025-10-18",
                "participants": 4
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "available" in data["data"]
        assert "pricing_breakdown" in data["data"]
```

#### **3. Booking Flow Integration Tests**
```python
class TestBookingFlow:
    @pytest.mark.asyncio
    async def test_complete_booking_flow(self):
        """Test end-to-end booking creation and management"""
        client = AsyncTestClient(app)
        user = await UserFactory.create()
        service = await ServiceFactory.create()
        token = create_access_token(user.id)
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 1: Add to cart
        cart_response = await client.post("/cart/items", json={
            "item_type": "service",
            "service_id": str(service.id),
            "booking_details": {
                "start_date": "2025-10-15",
                "end_date": "2025-10-18",
                "participants": 4
            }
        }, headers=headers)
        assert cart_response.status_code == 201
        
        # Step 2: Create booking
        booking_response = await client.post("/bookings", json={
            "booking_source": "cart",
            "cart_item_ids": [cart_response.json()["data"]["cart_item"]["id"]],
            "guest_details": {
                "primary_guest": {
                    "first_name": "Jean",
                    "last_name": "Dupont",
                    "email": "jean@example.com",
                    "phone": "+237690000000"
                }
            },
            "payment_method": "mobile_money_mtn",
            "terms_accepted": True
        }, headers=headers)
        
        assert booking_response.status_code == 201
        booking_data = booking_response.json()
        assert "bookings" in booking_data["data"]
        assert "payment_intent" in booking_data["data"]
```

### **External Service Integration Tests**

#### **1. Payment Gateway Tests**
```python
class TestPaymentIntegration:
    @pytest.mark.asyncio
    async def test_tranzak_payment_flow(self):
        """Test Tranzak payment integration"""
        with patch('integrations.tranzak.TranzakAPI') as mock_tranzak:
            # Mock successful payment intent creation
            mock_tranzak.create_payment_intent.return_value = {
                "id": "pi_test_123",
                "status": "requires_payment_method",
                "payment_url": "https://test.tranzak.com/pay/pi_test_123"
            }
            
            payment_service = PaymentService()
            result = await payment_service.create_payment_intent(
                amount=295800,
                currency="XAF",
                payment_method="mobile_money_mtn"
            )
            
            assert result.status == "requires_payment_method"
            assert "payment_url" in result.data

    @pytest.mark.asyncio
    async def test_payment_webhook_handling(self):
        """Test payment webhook processing"""
        client = AsyncTestClient(app)
        
        webhook_payload = {
            "event_type": "payment.succeeded",
            "data": {
                "payment_intent_id": "pi_test_123",
                "amount": 295800,
                "currency": "XAF",
                "status": "succeeded"
            }
        }
        
        response = await client.post(
            "/webhooks/tranzak",
            json=webhook_payload,
            headers={"X-Tranzak-Signature": "valid_signature"}
        )
        
        assert response.status_code == 200
        # Verify booking status was updated
```

#### **2. WhatsApp Integration Tests**
```python
class TestWhatsAppIntegration:
    @pytest.mark.asyncio
    async def test_otp_delivery_via_whatsapp(self):
        """Test OTP delivery through WhatsApp"""
        with patch('integrations.twilio.TwilioWhatsApp') as mock_whatsapp:
            mock_whatsapp.send_message.return_value = {
                "sid": "SM123456789",
                "status": "sent"
            }
            
            whatsapp_service = WhatsAppService()
            result = await whatsapp_service.send_otp(
                phone_number="+237690000000",
                otp_code="123456"
            )
            
            assert result.success is True
            assert result.message_id is not None

    @pytest.mark.asyncio
    async def test_booking_confirmation_message(self):
        """Test booking confirmation via WhatsApp"""
        booking = await BookingFactory.create()
        
        with patch('integrations.twilio.TwilioWhatsApp') as mock_whatsapp:
            notification_service = NotificationService()
            await notification_service.send_booking_confirmation(booking)
            
            mock_whatsapp.send_message.assert_called_once()
            call_args = mock_whatsapp.send_message.call_args
            assert booking.booking_number in call_args[1]["message"]
```

---

## 🎭 End-to-End Testing Strategy

### **E2E Testing Framework**
```python
# conftest.py - E2E test configuration
@pytest.fixture(scope="session")
async def browser():
    """Browser instance for E2E tests"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()

@pytest.fixture
async def page(browser):
    """Page instance with common setup"""
    context = await browser.new_context(
        viewport={"width": 1280, "height": 720},
        user_agent="Ganitel E2E Test Suite"
    )
    page = await context.new_page()
    yield page
    await context.close()
```

### **Critical User Journey Tests**

#### **1. Guest Booking Journey**
```python
class TestGuestBookingJourney:
    @pytest.mark.e2e
    async def test_guest_accommodation_booking(self, page):
        """Test complete guest booking flow for accommodation"""
        # Navigate to homepage
        await page.goto("https://app.ganitel.com")
        
        # Search for accommodation
        await page.fill('[data-testid="destination-input"]', "Yaoundé")
        await page.fill('[data-testid="checkin-date"]', "2025-10-15")
        await page.fill('[data-testid="checkout-date"]', "2025-10-18")
        await page.click('[data-testid="search-button"]')
        
        # Verify search results
        await page.wait_for_selector('[data-testid="service-card"]')
        service_cards = await page.query_selector_all('[data-testid="service-card"]')
        assert len(service_cards) > 0
        
        # Select first service
        await service_cards[0].click()
        await page.wait_for_selector('[data-testid="service-detail"]')
        
        # Check availability and book
        await page.click('[data-testid="check-availability"]')
        await page.wait_for_selector('[data-testid="booking-form"]')
        
        # Fill guest information
        await page.fill('[data-testid="guest-first-name"]', "Jean")
        await page.fill('[data-testid="guest-last-name"]', "Dupont")
        await page.fill('[data-testid="guest-email"]', "jean@example.com")
        await page.fill('[data-testid="guest-phone"]', "+237690000000")
        
        # Select payment method
        await page.click('[data-testid="payment-mobile-money"]')
        
        # Complete booking
        await page.click('[data-testid="complete-booking"]')
        
        # Verify booking confirmation
        await page.wait_for_selector('[data-testid="booking-confirmation"]')
        booking_number = await page.text_content('[data-testid="booking-number"]')
        assert booking_number.startswith("GAN-")

    @pytest.mark.e2e
    async def test_package_customization_booking(self, page):
        """Test package customization and booking flow"""
        await page.goto("https://app.ganitel.com/packages")
        
        # Browse packages
        await page.click('[data-testid="cultural-packages"]')
        await page.wait_for_selector('[data-testid="package-card"]')
        
        # Select package
        package_cards = await page.query_selector_all('[data-testid="package-card"]')
        await package_cards[0].click()
        
        # Customize package
        await page.click('[data-testid="customize-package"]')
        await page.check('[data-testid="accommodation-upgrade"]')
        await page.check('[data-testid="cooking-class-addon"]')
        
        # Proceed with customized booking
        await page.click('[data-testid="book-customized"]')
        
        # Verify customization reflects in price
        price_text = await page.text_content('[data-testid="total-price"]')
        assert "665,000" in price_text  # Expected customized price
```

#### **2. Provider Service Management**
```python
class TestProviderJourney:
    @pytest.mark.e2e
    async def test_provider_service_creation(self, page):
        """Test provider creating and managing a service"""
        # Login as provider
        await self.login_as_provider(page)
        
        # Navigate to service creation
        await page.goto("https://app.ganitel.com/provider/services/new")
        
        # Fill service details
        await page.select_option('[data-testid="category-select"]', "accommodation")
        await page.fill('[data-testid="service-title"]', "Beautiful Villa Test")
        await page.fill('[data-testid="service-description"]', "Test villa description")
        await page.fill('[data-testid="base-price"]', "100000")
        
        # Set location
        await page.fill('[data-testid="address"]', "Bastos, Yaoundé")
        await page.select_option('[data-testid="city"]', "Yaoundé")
        
        # Upload images
        await page.set_input_files(
            '[data-testid="image-upload"]', 
            ["test_assets/villa1.jpg", "test_assets/villa2.jpg"]
        )
        
        # Set amenities
        await page.check('[data-testid="amenity-wifi"]')
        await page.check('[data-testid="amenity-pool"]')
        
        # Submit for review
        await page.click('[data-testid="submit-service"]')
        
        # Verify submission success
        await page.wait_for_selector('[data-testid="submission-success"]')
        success_message = await page.text_content('[data-testid="success-message"]')
        assert "submitted for review" in success_message.lower()

    async def login_as_provider(self, page):
        """Helper method for provider login"""
        await page.goto("https://app.ganitel.com/login")
        await page.fill('[data-testid="phone-input"]', "+237690111111")
        await page.click('[data-testid="send-otp"]')
        # Mock OTP verification in test environment
        await page.fill('[data-testid="otp-input"]', "123456")
        await page.click('[data-testid="verify-otp"]')
        await page.wait_for_selector('[data-testid="provider-dashboard"]')
```

### **Mobile E2E Testing**
```python
@pytest.fixture
async def mobile_page(browser):
    """Mobile viewport for testing"""
    context = await browser.new_context(
        viewport={"width": 375, "height": 667},  # iPhone SE
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
    )
    page = await context.new_page()
    yield page
    await context.close()

class TestMobileExperience:
    @pytest.mark.e2e
    async def test_mobile_search_and_book(self, mobile_page):
        """Test mobile-optimized booking flow"""
        await mobile_page.goto("https://app.ganitel.com")
        
        # Test mobile navigation
        await mobile_page.click('[data-testid="mobile-menu"]')
        await mobile_page.wait_for_selector('[data-testid="mobile-menu-open"]')
        
        # Test swipe gestures (if implemented)
        await mobile_page.swipe('[data-testid="service-gallery"]', "left")
        
        # Test touch-optimized interactions
        await mobile_page.tap('[data-testid="book-now-mobile"]')
```

---

## ⚡ Performance Testing Strategy

### **Load Testing Framework**
```python
# locustfile.py - Load testing scenarios
from locust import HttpUser, task, between

class TravelerUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        """Login user at start of test"""
        response = self.client.post("/auth/request-otp", json={
            "contact": "+237690000000",
            "contact_type": "whatsapp",
            "purpose": "login"
        })
        
        # Mock OTP verification
        self.client.post("/auth/verify-otp", json={
            "contact": "+237690000000",
            "otp": "123456"
        })
    
    @task(3)
    def search_services(self):
        """Search for services - most common action"""
        self.client.get("/services", params={
            "category": "accommodation",
            "city": "Yaoundé",
            "start_date": "2025-10-15",
            "end_date": "2025-10-18"
        })
    
    @task(2)
    def view_service_details(self):
        """View service details"""
        # Assume we have service IDs from search
        service_id = "service-123"
        self.client.get(f"/services/{service_id}")
    
    @task(1)
    def check_availability(self):
        """Check service availability"""
        service_id = "service-123"
        self.client.get(f"/services/{service_id}/availability", params={
            "start_date": "2025-10-15",
            "end_date": "2025-10-18",
            "participants": 4
        })
    
    @task(1)
    def manage_cart(self):
        """Add/remove items from cart"""
        self.client.post("/cart/items", json={
            "item_type": "service",
            "service_id": "service-123",
            "booking_details": {
                "start_date": "2025-10-15",
                "end_date": "2025-10-18",
                "participants": 4
            }
        })
```

### **Performance Test Scenarios**

#### **1. Peak Load Testing**
```bash
# Peak hours simulation (8 AM - 10 PM)
locust -f locustfile.py --host=https://api.ganitel.com \
       --users=1000 --spawn-rate=50 --run-time=30m \
       --html=reports/peak_load_report.html
```

#### **2. Stress Testing**
```bash
# Find breaking point
locust -f locustfile.py --host=https://api.ganitel.com \
       --users=2000 --spawn-rate=100 --run-time=15m \
       --html=reports/stress_test_report.html
```

#### **3. Database Performance Testing**
```python
class TestDatabasePerformance:
    @pytest.mark.performance
    async def test_service_search_performance(self):
        """Test search query performance with large dataset"""
        # Create large dataset
        await ServiceFactory.create_batch(10000)
        
        start_time = time.time()
        
        # Complex search query
        results = await ServiceSearch.search(
            category="accommodation",
            city="Yaoundé",
            min_price=50000,
            max_price=200000,
            amenities=["wifi", "pool"],
            sort="rating_desc"
        )
        
        end_time = time.time()
        query_time = end_time - start_time
        
        # Performance assertions
        assert query_time < 0.5  # Query should complete in <500ms
        assert len(results) > 0
        
    @pytest.mark.performance
    async def test_booking_creation_performance(self):
        """Test booking creation under load"""
        async def create_booking():
            booking = await BookingFactory.create()
            return booking.id
        
        # Simulate concurrent bookings
        tasks = [create_booking() for _ in range(100)]
        start_time = time.time()
        
        booking_ids = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Performance assertions
        assert total_time < 10  # 100 bookings in <10 seconds
        assert len(booking_ids) == 100
        assert len(set(booking_ids)) == 100  # All unique
```

---

## 🔒 Security Testing Strategy

### **Security Testing Categories**

#### **1. Authentication & Authorization Tests**
```python
class TestSecurityAuth:
    @pytest.mark.security
    async def test_jwt_token_security(self):
        """Test JWT token security measures"""
        client = AsyncTestClient(app)
        user = await UserFactory.create()
        
        # Test token expiration
        expired_token = create_access_token(
            user.id, 
            expires_delta=timedelta(seconds=-1)
        )
        
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
        
        # Test token tampering
        valid_token = create_access_token(user.id)
        tampered_token = valid_token[:-5] + "XXXXX"
        
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"}
        )
        assert response.status_code == 401

    @pytest.mark.security
    async def test_rate_limiting(self):
        """Test API rate limiting"""
        client = AsyncTestClient(app)
        
        # Attempt to exceed rate limit
        for i in range(150):  # Assuming limit is 100/minute
            response = await client.post("/auth/request-otp", json={
                "contact": "+237690000000",
                "contact_type": "whatsapp",
                "purpose": "login"
            })
            
            if response.status_code == 429:
                break
        
        assert response.status_code == 429
        assert "rate limit" in response.json()["errors"][0]["message"].lower()
```

#### **2. Input Validation & Injection Tests**
```python
class TestInputSecurity:
    @pytest.mark.security
    async def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        client = AsyncTestClient(app)
        
        # Attempt SQL injection in search
        malicious_input = "'; DROP TABLE services; --"
        
        response = await client.get(f"/services?city={malicious_input}")
        
        # Should not cause server error
        assert response.status_code in [200, 400]
        
        # Database should still be intact
        service_count = await Service.objects.count()
        assert service_count >= 0  # Services table still exists

    @pytest.mark.security
    async def test_xss_prevention(self):
        """Test XSS prevention in user input"""
        client = AsyncTestClient(app)
        user = await UserFactory.create()
        token = create_access_token(user.id)
        
        # Attempt XSS in service creation
        xss_payload = "<script>alert('XSS')</script>"
        
        response = await client.post("/services", json={
            "title": xss_payload,
            "description": "Normal description",
            "category_id": "accommodation"
        }, headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 201:
            service_data = response.json()
            # XSS payload should be escaped/sanitized
            assert "<script>" not in service_data["data"]["title"]

    @pytest.mark.security
    async def test_file_upload_security(self):
        """Test file upload security measures"""
        client = AsyncTestClient(app)
        provider = await ProviderFactory.create()
        token = create_access_token(provider.user.id)
        
        # Test malicious file upload
        malicious_file = b"<?php system($_GET['cmd']); ?>"
        
        response = await client.post("/services/{service_id}/upload", 
            files={"image": ("malicious.php", malicious_file, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should reject non-image files
        assert response.status_code == 400
        assert "invalid file type" in response.json()["errors"][0]["message"].lower()
```

#### **3. Data Privacy & GDPR Compliance Tests**
```python
class TestDataPrivacy:
    @pytest.mark.security
    async def test_data_anonymization(self):
        """Test user data anonymization"""
        user = await UserFactory.create()
        booking = await BookingFactory.create(guest=user)
        
        # Request data deletion
        privacy_service = PrivacyService()
        await privacy_service.anonymize_user_data(user.id)
        
        # Verify personal data is anonymized
        anonymized_user = await User.objects.get(id=user.id)
        assert anonymized_user.email.startswith("deleted_user_")
        assert anonymized_user.first_name == "Deleted"
        assert anonymized_user.last_name == "User"
        
        # Verify booking history is preserved but anonymized
        anonymized_booking = await Booking.objects.get(id=booking.id)
        assert anonymized_booking.guest_id == user.id
        assert anonymized_booking.guest_name == "Deleted User"

    @pytest.mark.security
    async def test_sensitive_data_logging(self):
        """Test that sensitive data is not logged"""
        with patch('logging.Logger.info') as mock_logger:
            # Trigger payment processing
            payment_data = {
                "amount": 100000,
                "payment_method": "mobile_money_mtn",
                "payment_phone": "+237690000000"
            }
            
            payment_service = PaymentService()
            await payment_service.process_payment(payment_data)
            
            # Verify sensitive data is not in logs
            logged_calls = [call.args[0] for call in mock_logger.call_args_list]
            for log_message in logged_calls:
                assert "690000000" not in str(log_message)  # Phone number
                assert "payment_phone" not in str(log_message)
```

---

## 📊 Test Automation & CI/CD Integration

### **GitHub Actions Workflow**
```yaml
# .github/workflows/testing.yml
name: Comprehensive Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements-test.txt
    
    - name: Run unit tests
      run: |
        pytest tests/unit/ --cov=app --cov-report=xml --cov-report=html
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run integration tests
      run: |
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
    
    - name: Collect test results
      run: |
        docker-compose -f docker-compose.test.yml logs api > integration-logs.txt

  security-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security tests
      run: |
        pytest tests/security/ -v
    
    - name: SAST Scan
      uses: github/super-linter@v4
      env:
        DEFAULT_BRANCH: main
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Playwright
      run: |
        pip install playwright pytest-playwright
        playwright install chromium
    
    - name: Run E2E tests
      run: |
        pytest tests/e2e/ --browser chromium --video=on --screenshot=on
    
    - name: Upload test artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: e2e-artifacts
        path: test-results/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run performance tests
      run: |
        pip install locust
        locust -f tests/performance/locustfile.py --headless \
               --users 100 --spawn-rate 10 --run-time 5m \
               --host https://staging.ganitel.com \
               --html performance-report.html
    
    - name: Upload performance report
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: performance-report.html
```

### **Test Environment Management**
```python
# tests/conftest.py - Global test configuration
import pytest
import asyncio
from typing import Generator
from httpx import AsyncClient
from app.main import app
from app.database import get_db_session
from app.config import get_settings

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_db():
    """Create test database"""
    settings = get_settings()
    test_db_url = f"{settings.database_url}_test"
    
    # Create test database
    await create_test_database(test_db_url)
    
    yield test_db_url
    
    # Cleanup
    await drop_test_database(test_db_url)

@pytest.fixture
async def client(test_db) -> AsyncClient:
    """HTTP client for API testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(autouse=True)
async def clean_db(test_db):
    """Clean database between tests"""
    # Truncate all tables
    async with get_db_session() as session:
        await session.execute("TRUNCATE TABLE users CASCADE")
        await session.execute("TRUNCATE TABLE services CASCADE")
        await session.execute("TRUNCATE TABLE bookings CASCADE")
        await session.commit()
```

This comprehensive testing strategy ensures the Ganitel platform maintains high quality, security, and performance standards across all components and user journeys. The multi-layered approach catches issues early and provides confidence for continuous deployment.