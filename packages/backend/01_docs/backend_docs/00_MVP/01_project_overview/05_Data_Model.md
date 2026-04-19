# ✅ Ganitel V2 — Complete Data Model Design

This document defines the comprehensive data model for the Ganitel multi-service travel platform, supporting all 6 service categories, package system, and complex user journeys.

---

## 🎯 Data Model Philosophy

### **Design Principles**
1. **Service-Agnostic Core**: Generic entities that work across all service types
2. **Type-Specific Extensions**: Specialized tables for service-specific attributes
3. **Scalable Relationships**: Efficient many-to-many and hierarchical relationships
4. **Audit Trail**: Complete tracking of all changes and user actions
5. **Multi-Tenant Security**: Row-level security for provider data isolation
6. **Performance Optimized**: Indexes and partitioning for query performance

### **Database Schema Strategy**
- **Core Entities**: Users, Services, Bookings, Payments - foundation for all operations
- **Service-Specific Tables**: Specialized data for each service category
- **Relationship Tables**: Many-to-many relationships with additional metadata
- **Audit Tables**: Change tracking and compliance requirements
- **Lookup Tables**: Reference data and configuration

---

## 👤 User Management Schema

### **Users Table (Core)**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    date_of_birth DATE,
    gender user_gender_enum,
    origin VARCHAR(100), -- Country or region of origin
    role user_role_enum NOT NULL DEFAULT 'traveler',
    status user_status_enum NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    whatsapp_verified BOOLEAN DEFAULT FALSE,
    language_preference VARCHAR(10) DEFAULT 'en',
    currency_preference VARCHAR(3) DEFAULT 'XAF',
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_whatsapp CHECK (whatsapp ~* '^\+[1-9]\d{1,14}$')
);

-- Enums
CREATE TYPE user_gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE user_role_enum AS ENUM ('traveler', 'provider', 'admin', 'super_admin');
CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'deactivated', 'pending_verification');

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_whatsapp ON users(whatsapp);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### **User Profiles (Extended Information)**
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    interests TEXT[], -- Array of interest keywords
    dietary_restrictions TEXT[], -- Dietary preferences and restrictions
    accessibility_needs TEXT[], -- Accessibility requirements
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    passport_number VARCHAR(50),
    passport_expiry_date DATE,
    travel_preferences JSONB, -- Flexible JSON for complex preferences
    marketing_consent BOOLEAN DEFAULT FALSE,
    data_processing_consent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Provider Profiles (Business Information)**
```sql
CREATE TABLE provider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type provider_business_type_enum NOT NULL,
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    business_address TEXT NOT NULL,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    website_url TEXT,
    business_description TEXT,
    service_categories service_category_enum[] NOT NULL,
    verification_status provider_verification_enum DEFAULT 'pending',
    verification_documents JSONB, -- Document URLs and metadata
    bank_account_details JSONB, -- Encrypted bank account information
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Commission percentage
    payout_schedule payout_schedule_enum DEFAULT 'weekly',
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_bookings INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enums
CREATE TYPE provider_business_type_enum AS ENUM (
    'individual', 'partnership', 'corporation', 'cooperative', 'ngo'
);
CREATE TYPE provider_verification_enum AS ENUM (
    'pending', 'verified', 'rejected', 'suspended', 'under_review'
);
CREATE TYPE payout_schedule_enum AS ENUM ('daily', 'weekly', 'monthly', 'on_demand');
```

---

## 🏢 Service Management Schema

### **Service Categories (Reference Data)**
```sql
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'accommodation', 'vehicle', 'dining', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    color_hex VARCHAR(7), -- UI color theme
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default commission rate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO service_categories (code, name, description, commission_rate) VALUES
('accommodation', 'Accommodation', 'Hotels, guesthouses, vacation rentals', 12.00),
('vehicle', 'Vehicle Rental', 'Car rentals, motorcycles, buses with drivers', 15.00),
('dining', 'Dining & Restaurants', 'Restaurant reservations and food delivery', 8.00),
('tours', 'Tours & Activities', 'Guided tours, cultural experiences, activities', 10.00),
('wellness', 'Wellness & Spa', 'Spa treatments, wellness retreats, relaxation', 12.00),
('flights', 'Flight Bookings', 'Domestic and regional flight bookings', 5.00);
```

### **Services (Core Service Entity)**
```sql
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES service_categories(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- SEO-friendly URL
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    base_price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',
    price_unit service_price_unit_enum NOT NULL, -- per night, per hour, per person, etc.
    minimum_price DECIMAL(12,2), -- Minimum price for dynamic pricing
    maximum_price DECIMAL(12,2), -- Maximum price for dynamic pricing
    capacity INTEGER, -- Maximum guests/participants
    minimum_booking_duration INTEGER DEFAULT 1, -- Minimum hours/days/units
    maximum_booking_duration INTEGER, -- Maximum duration allowed
    booking_advance_notice INTEGER DEFAULT 24, -- Hours advance notice required
    cancellation_policy service_cancellation_enum DEFAULT 'moderate',
    instant_booking BOOLEAN DEFAULT FALSE,
    location_address TEXT,
    location_city VARCHAR(100),
    location_region VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'Cameroon',
    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8),
    service_metadata JSONB, -- Service-specific data
    status service_status_enum DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT positive_base_price CHECK (base_price > 0),
    CONSTRAINT positive_capacity CHECK (capacity > 0),
    CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
    CONSTRAINT valid_coordinates CHECK (
        (location_latitude IS NULL AND location_longitude IS NULL) OR
        (location_latitude BETWEEN -90 AND 90 AND location_longitude BETWEEN -180 AND 180)
    )
);

-- Enums
CREATE TYPE service_price_unit_enum AS ENUM (
    'per_night', 'per_hour', 'per_day', 'per_person', 'per_group', 'per_session', 'flat_rate'
);
CREATE TYPE service_cancellation_enum AS ENUM (
    'flexible', 'moderate', 'strict', 'super_strict', 'non_refundable'
);
CREATE TYPE service_status_enum AS ENUM (
    'draft', 'pending_review', 'active', 'paused', 'rejected', 'archived'
);

-- Indexes
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_location ON services(location_city, location_region);
CREATE INDEX idx_services_featured ON services(featured) WHERE featured = TRUE;
CREATE INDEX idx_services_price_range ON services(base_price);
```

---

## 🏠 Service-Specific Extension Tables

### **Accommodation Extensions**
```sql
CREATE TABLE service_accommodations (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    property_type accommodation_type_enum NOT NULL,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    beds INTEGER NOT NULL DEFAULT 1,
    square_meters INTEGER,
    floor_number INTEGER,
    check_in_time TIME DEFAULT '15:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    house_rules TEXT[],
    wifi_available BOOLEAN DEFAULT FALSE,
    parking_available BOOLEAN DEFAULT FALSE,
    air_conditioning BOOLEAN DEFAULT FALSE,
    kitchen_available BOOLEAN DEFAULT FALSE,
    pool_available BOOLEAN DEFAULT FALSE,
    gym_available BOOLEAN DEFAULT FALSE,
    pet_friendly BOOLEAN DEFAULT FALSE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    accessibility_features TEXT[],
    nearby_attractions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE accommodation_type_enum AS ENUM (
    'apartment', 'house', 'villa', 'guesthouse', 'hotel_room', 'studio', 'chalet', 'cabin'
);
```

### **Vehicle Rental Extensions**
```sql
CREATE TABLE service_vehicles (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    vehicle_type vehicle_type_enum NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    license_plate VARCHAR(20),
    fuel_type fuel_type_enum DEFAULT 'gasoline',
    transmission transmission_enum DEFAULT 'manual',
    seating_capacity INTEGER NOT NULL,
    luggage_capacity INTEGER,
    air_conditioning BOOLEAN DEFAULT FALSE,
    gps_available BOOLEAN DEFAULT FALSE,
    bluetooth_available BOOLEAN DEFAULT FALSE,
    child_seats_available BOOLEAN DEFAULT FALSE,
    driver_included BOOLEAN DEFAULT TRUE,
    driver_profiles JSONB, -- Driver information when included
    pickup_locations TEXT[],
    fuel_policy fuel_policy_enum DEFAULT 'full_to_full',
    mileage_limit INTEGER, -- Daily mileage limit
    insurance_included BOOLEAN DEFAULT TRUE,
    insurance_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE vehicle_type_enum AS ENUM (
    'sedan', 'suv', 'hatchback', 'minivan', 'bus', 'motorcycle', 'scooter', 'bicycle'
);
CREATE TYPE fuel_type_enum AS ENUM ('gasoline', 'diesel', 'electric', 'hybrid');
CREATE TYPE transmission_enum AS ENUM ('manual', 'automatic');
CREATE TYPE fuel_policy_enum AS ENUM ('full_to_full', 'same_to_same', 'pre_purchase');
```

### **Dining Service Extensions**
```sql
CREATE TABLE service_dining (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    restaurant_type dining_type_enum NOT NULL,
    cuisine_types TEXT[] NOT NULL,
    dietary_options TEXT[], -- vegan, halal, gluten-free, etc.
    service_types dining_service_enum[] NOT NULL,
    seating_capacity INTEGER,
    private_dining_available BOOLEAN DEFAULT FALSE,
    outdoor_seating BOOLEAN DEFAULT FALSE,
    takeaway_available BOOLEAN DEFAULT TRUE,
    delivery_available BOOLEAN DEFAULT FALSE,
    delivery_radius INTEGER, -- Kilometers
    delivery_fee DECIMAL(8,2),
    minimum_order_amount DECIMAL(8,2),
    operating_hours JSONB, -- Flexible schedule per day
    reservation_required BOOLEAN DEFAULT FALSE,
    average_meal_duration INTEGER DEFAULT 90, -- Minutes
    dress_code dining_dress_code_enum DEFAULT 'casual',
    payment_methods TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE dining_type_enum AS ENUM (
    'restaurant', 'cafe', 'bar', 'food_truck', 'catering', 'fast_food', 'fine_dining'
);
CREATE TYPE dining_service_enum AS ENUM ('dine_in', 'takeaway', 'delivery', 'catering');
CREATE TYPE dining_dress_code_enum AS ENUM ('casual', 'smart_casual', 'formal', 'no_restriction');
```

### **Tours & Activities Extensions**
```sql
CREATE TABLE service_tours (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    tour_type tour_type_enum NOT NULL,
    activity_level activity_level_enum DEFAULT 'moderate',
    duration_hours DECIMAL(4,2) NOT NULL,
    group_size_min INTEGER DEFAULT 1,
    group_size_max INTEGER DEFAULT 10,
    age_restrictions JSONB, -- Min/max age, child policies
    languages_offered TEXT[] DEFAULT '{"English", "French"}',
    included_services TEXT[], -- What's included in the tour
    excluded_services TEXT[], -- What's not included
    required_equipment TEXT[], -- Equipment tourists need to bring
    provided_equipment TEXT[], -- Equipment provided by tour operator
    meeting_point TEXT NOT NULL,
    meeting_instructions TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    physical_requirements TEXT[],
    weather_dependent BOOLEAN DEFAULT FALSE,
    cancellation_weather BOOLEAN DEFAULT FALSE,
    guide_profiles JSONB, -- Guide information and qualifications
    certifications TEXT[], -- Tour operator certifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE tour_type_enum AS ENUM (
    'cultural', 'historical', 'adventure', 'wildlife', 'culinary', 'photography', 'educational', 'religious'
);
CREATE TYPE activity_level_enum AS ENUM ('easy', 'moderate', 'challenging', 'extreme');
```

### **Wellness & Spa Extensions**
```sql
CREATE TABLE service_wellness (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    wellness_type wellness_type_enum NOT NULL,
    treatment_duration INTEGER NOT NULL, -- Minutes
    therapist_gender therapist_gender_enum,
    treatment_area wellness_area_enum DEFAULT 'indoor',
    equipment_required BOOLEAN DEFAULT FALSE,
    equipment_provided TEXT[],
    health_restrictions TEXT[], -- Health conditions that prevent treatment
    age_restrictions JSONB,
    preparation_instructions TEXT,
    aftercare_instructions TEXT,
    package_treatments JSONB, -- Multi-treatment packages
    therapist_profiles JSONB, -- Therapist qualifications and experience
    certifications TEXT[],
    mobile_service BOOLEAN DEFAULT FALSE, -- Can be performed at client location
    group_sessions BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE wellness_type_enum AS ENUM (
    'massage', 'facial', 'body_treatment', 'aromatherapy', 'reflexology', 'acupuncture', 'meditation', 'yoga'
);
CREATE TYPE therapist_gender_enum AS ENUM ('male', 'female', 'any', 'client_preference');
CREATE TYPE wellness_area_enum AS ENUM ('indoor', 'outdoor', 'poolside', 'beachside', 'garden');
```

---

## 📦 Package System Schema

### **Packages (Pre-Built Travel Packages)**
```sql
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    package_type package_type_enum NOT NULL,
    duration_days INTEGER NOT NULL,
    duration_nights INTEGER,
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER DEFAULT 10,
    base_price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',
    price_per_person BOOLEAN DEFAULT TRUE,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    seasonal_pricing JSONB, -- Date-based pricing variations
    included_services TEXT[],
    excluded_services TEXT[],
    itinerary JSONB, -- Day-by-day itinerary
    customizable BOOLEAN DEFAULT TRUE,
    customization_options JSONB, -- Available customization options
    booking_deadline INTEGER DEFAULT 72, -- Hours before start
    cancellation_policy package_cancellation_enum DEFAULT 'moderate',
    target_audience TEXT[], -- Families, couples, solo travelers, etc.
    activity_level activity_level_enum DEFAULT 'moderate',
    best_season TEXT[], -- Recommended months
    status package_status_enum DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE package_type_enum AS ENUM (
    'city_break', 'adventure', 'cultural', 'relaxation', 'business', 'family', 'romantic', 'luxury'
);
CREATE TYPE package_cancellation_enum AS ENUM (
    'flexible', 'moderate', 'strict', 'non_refundable'
);
CREATE TYPE package_status_enum AS ENUM (
    'draft', 'pending_review', 'active', 'paused', 'archived'
);
```

### **Package Services (Many-to-Many Relationship)**
```sql
CREATE TABLE package_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL, -- Which day of the package
    order_in_day INTEGER DEFAULT 1,
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_customizable BOOLEAN DEFAULT FALSE,
    custom_price DECIMAL(12,2), -- Override service price for package
    quantity INTEGER DEFAULT 1,
    duration_override INTEGER, -- Override service duration
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(package_id, service_id, day_number),
    CONSTRAINT valid_day_number CHECK (day_number > 0)
);

-- Index for efficient package queries
CREATE INDEX idx_package_services_package ON package_services(package_id, day_number);
```

---

## 🛒 Booking & Cart System Schema

### **Shopping Cart**
```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type cart_item_type_enum NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    participants INTEGER DEFAULT 1,
    special_requests TEXT,
    customizations JSONB, -- Package customizations
    price_snapshot DECIMAL(12,2) NOT NULL, -- Price at time of adding to cart
    currency VARCHAR(3) DEFAULT 'XAF',
    expires_at TIMESTAMP WITH TIME ZONE, -- Cart item expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT cart_item_reference CHECK (
        (item_type = 'service' AND service_id IS NOT NULL AND package_id IS NULL) OR
        (item_type = 'package' AND package_id IS NOT NULL AND service_id IS NULL)
    ),
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_participants CHECK (participants > 0),
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TYPE cart_item_type_enum AS ENUM ('service', 'package');

-- Index for efficient cart queries
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_expires ON cart_items(expires_at) WHERE expires_at IS NOT NULL;
```

### **Bookings (Confirmed Reservations)**
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(20) UNIQUE NOT NULL, -- Human-readable booking reference
    user_id UUID NOT NULL REFERENCES users(id),
    booking_type booking_type_enum NOT NULL,
    service_id UUID REFERENCES services(id),
    package_id UUID REFERENCES packages(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    -- Booking Details
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    participants INTEGER NOT NULL DEFAULT 1,
    
    -- Pricing
    subtotal DECIMAL(12,2) NOT NULL,
    taxes DECIMAL(12,2) DEFAULT 0.00,
    fees DECIMAL(12,2) DEFAULT 0.00,
    discount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',
    
    -- Status and Communication
    status booking_status_enum DEFAULT 'pending',
    payment_status payment_status_enum DEFAULT 'pending',
    guest_message TEXT,
    provider_response TEXT,
    special_requests TEXT,
    booking_modifications JSONB, -- History of changes
    
    -- Important Dates
    confirmation_deadline TIMESTAMP WITH TIME ZONE,
    cancellation_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT booking_reference_check CHECK (
        (booking_type = 'service' AND service_id IS NOT NULL AND package_id IS NULL) OR
        (booking_type = 'package' AND package_id IS NOT NULL AND service_id IS NULL)
    ),
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND taxes >= 0 AND fees >= 0 AND 
        discount >= 0 AND total_amount >= 0
    ),
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TYPE booking_type_enum AS ENUM ('service', 'package');
CREATE TYPE booking_status_enum AS ENUM (
    'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'disputed'
);
CREATE TYPE payment_status_enum AS ENUM (
    'pending', 'partial', 'paid', 'refunded', 'failed', 'cancelled'
);

-- Indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE UNIQUE INDEX idx_booking_number ON bookings(booking_number);
```

---

## 💳 Payment System Schema

### **Payments**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_reference VARCHAR(100) UNIQUE NOT NULL, -- External payment reference
    payment_method payment_method_enum NOT NULL,
    provider payment_provider_enum NOT NULL,
    
    -- Amount Details
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',
    fees DECIMAL(8,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL, -- Amount after fees
    
    -- Payment Flow
    payment_intent_id VARCHAR(255), -- Provider-specific intent ID
    status payment_transaction_status_enum DEFAULT 'pending',
    failure_reason TEXT,
    provider_response JSONB, -- Full provider response
    
    -- Important Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    device_info JSONB,
    
    CONSTRAINT positive_payment_amount CHECK (amount > 0),
    CONSTRAINT positive_net_amount CHECK (net_amount > 0)
);

CREATE TYPE payment_method_enum AS ENUM (
    'mobile_money_mtn', 'mobile_money_orange', 'credit_card', 'debit_card', 
    'bank_transfer', 'cash', 'crypto'
);
CREATE TYPE payment_provider_enum AS ENUM (
    'tranzak', 'flutterwave', 'stripe', 'mtn_momo', 'orange_money'
);
CREATE TYPE payment_transaction_status_enum AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
);

-- Indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_provider ON payments(provider);
```

### **Refunds**
```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    refund_reference VARCHAR(100) UNIQUE NOT NULL,
    
    -- Refund Details
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_reason refund_reason_enum NOT NULL,
    refund_description TEXT,
    refund_percentage DECIMAL(5,2), -- If partial refund
    
    -- Processing
    status refund_status_enum DEFAULT 'pending',
    processed_by UUID REFERENCES users(id), -- Admin who processed
    provider_response JSONB,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT positive_refund_amount CHECK (refund_amount > 0)
);

CREATE TYPE refund_reason_enum AS ENUM (
    'cancellation', 'no_show_provider', 'service_issue', 'customer_request', 
    'dispute_resolution', 'admin_decision'
);
CREATE TYPE refund_status_enum AS ENUM ('pending', 'approved', 'processing', 'completed', 'rejected');
```

---

## 📸 Media & Content Schema

### **Media Files**
```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    file_type media_type_enum NOT NULL,
    entity_type media_entity_enum NOT NULL,
    entity_id UUID NOT NULL, -- Reference to service, package, user, etc.
    
    -- File Details
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER NOT NULL, -- Bytes
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    duration INTEGER, -- For videos/audio in seconds
    
    -- Organization
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE, -- Main image/video for entity
    
    -- Status
    status media_status_enum DEFAULT 'pending',
    moderation_notes TEXT,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT positive_file_size CHECK (file_size > 0),
    CONSTRAINT valid_dimensions CHECK (
        (width IS NULL AND height IS NULL) OR 
        (width > 0 AND height > 0)
    )
);

CREATE TYPE media_type_enum AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE media_entity_enum AS ENUM ('service', 'package', 'user', 'review', 'message');
CREATE TYPE media_status_enum AS ENUM ('pending', 'approved', 'rejected', 'processing');

-- Indexes
CREATE INDEX idx_media_entity ON media_files(entity_type, entity_id);
CREATE INDEX idx_media_status ON media_files(status);
CREATE INDEX idx_media_primary ON media_files(entity_type, entity_id, is_primary) 
    WHERE is_primary = TRUE;
```

---

## ⭐ Reviews & Ratings Schema

### **Reviews**
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    package_id UUID REFERENCES packages(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    -- Rating Details
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
    service_quality_rating INTEGER CHECK (service_quality_rating BETWEEN 1 AND 5),
    
    -- Review Content
    title VARCHAR(255),
    comment TEXT,
    pros TEXT[],
    cons TEXT[],
    tips_for_future_guests TEXT,
    
    -- Moderation
    status review_status_enum DEFAULT 'pending',
    moderation_notes TEXT,
    flagged_inappropriate BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    
    -- Response
    provider_response TEXT,
    provider_response_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure only one review per booking
    UNIQUE(booking_id),
    
    CONSTRAINT review_reference_check CHECK (
        (service_id IS NOT NULL AND package_id IS NULL) OR
        (package_id IS NOT NULL AND service_id IS NULL)
    )
);

CREATE TYPE review_status_enum AS ENUM ('pending', 'published', 'rejected', 'hidden');

-- Indexes
CREATE INDEX idx_reviews_service ON reviews(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX idx_reviews_package ON reviews(package_id) WHERE package_id IS NOT NULL;
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
```

---

## 💬 Communication Schema

### **Messages**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    
    -- Message Content
    message_type message_type_enum DEFAULT 'text',
    content TEXT NOT NULL,
    media_attachments UUID[], -- References to media_files
    
    -- Message Status
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- External Integration
    whatsapp_message_id VARCHAR(255), -- Twilio WhatsApp message ID
    sms_message_id VARCHAR(255), -- SMS provider message ID
    email_message_id VARCHAR(255), -- Email provider message ID
    
    -- Metadata
    is_automated BOOLEAN DEFAULT FALSE,
    automated_trigger VARCHAR(100), -- booking_confirmed, payment_received, etc.
    
    CONSTRAINT different_participants CHECK (sender_id != recipient_id)
);

CREATE TYPE message_type_enum AS ENUM ('text', 'media', 'system', 'automated');

-- Indexes for efficient conversation queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at);
CREATE INDEX idx_messages_booking ON messages(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
```

---

## 🔍 Search & Discovery Schema

### **Search Analytics**
```sql
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100), -- Anonymous session tracking
    
    -- Search Details
    query_text TEXT,
    search_filters JSONB,
    results_count INTEGER DEFAULT 0,
    
    -- User Interaction
    clicked_results UUID[], -- Service/package IDs clicked
    booking_resulted BOOLEAN DEFAULT FALSE,
    
    -- Context
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    
    -- Performance
    search_duration_ms INTEGER, -- Search execution time
    page_number INTEGER DEFAULT 1
);

-- Index for analytics
CREATE INDEX idx_search_queries_date ON search_queries(searched_at);
CREATE INDEX idx_search_queries_user ON search_queries(user_id) WHERE user_id IS NOT NULL;
```

---

## 📊 Analytics & Reporting Schema

### **User Activity Tracking**
```sql
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    
    -- Activity Details
    activity_type user_activity_enum NOT NULL,
    entity_type VARCHAR(50), -- service, package, booking, etc.
    entity_id UUID,
    
    -- Context
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    
    -- Additional Data
    metadata JSONB
);

CREATE TYPE user_activity_enum AS ENUM (
    'page_view', 'search', 'service_view', 'package_view', 'add_to_cart', 
    'remove_from_cart', 'booking_started', 'booking_completed', 'payment_completed',
    'review_submitted', 'message_sent', 'profile_updated'
);

-- Partitioned by month for performance
CREATE INDEX idx_user_activities_date ON user_activities(occurred_at);
CREATE INDEX idx_user_activities_user ON user_activities(user_id) WHERE user_id IS NOT NULL;
```

---

## 🔧 System Configuration Schema

### **Application Settings**
```sql
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type setting_type_enum NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be accessed by frontend
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE setting_type_enum AS ENUM (
    'string', 'number', 'boolean', 'json', 'array'
);

-- Insert default settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_commission_rate', '10.0', 'number', 'Default platform commission percentage', false),
('max_cart_items', '20', 'number', 'Maximum items allowed in cart', true),
('booking_advance_notice_hours', '24', 'number', 'Default advance booking notice in hours', true),
('supported_currencies', '["XAF", "USD", "EUR"]', 'array', 'Supported platform currencies', true),
('maintenance_mode', 'false', 'boolean', 'Platform maintenance mode status', true);
```

This comprehensive data model provides a solid foundation for the Ganitel multi-service platform, supporting all current requirements while maintaining flexibility for future expansion and optimization.