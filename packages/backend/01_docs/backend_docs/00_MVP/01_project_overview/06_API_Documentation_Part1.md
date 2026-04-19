# Ganitel — Complete REST API Documentation

This document provides comprehensive API documentation for the Ganitel multi-service travel platform. This API serves as the backend for web, mobile, and partner integrations.

---

## 📋 API Overview

### **Base Information**
- **Base URL**: `https://api.ganitel.com/v1`
- **Protocol**: HTTPS only
- **Authentication**: JWT Bearer tokens
- **Data Format**: JSON
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- **Currency**: XAF (Central African Franc) as default, USD and EUR supported

### **HTTP Status Codes**
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate, etc.) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### **Standard Response Format**
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "has_next": true,
      "has_prev": false
    },
    "filters_applied": {},
    "execution_time": "0.123s",
    "request_id": "req_123456789"
  },
  "errors": null
}
```

### **Error Response Format**
```json
{
  "success": false,
  "data": null,
  "meta": {
    "request_id": "req_123456789",
    "timestamp": "2025-09-18T10:30:00Z"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid email format",
      "field": "email",
      "details": {}
    }
  ]
}
```

---

## 🔐 Authentication API (might change)

### **POST /auth/request-otp**
Send OTP code to user's WhatsApp or SMS.

**Request:**
```json
{
  "contact": "+237690000000",
  "contact_type": "whatsapp", // "whatsapp" or "sms"
  "purpose": "login" // "login" or "registration"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to WhatsApp",
    "expires_in": 300,
    "can_resend_in": 60
  }
}
```

### **POST /auth/verify-otp**
Verify OTP and authenticate user.

**Request:**
```json
{
  "contact": "+237690000000",
  "otp": "123456",
  "device_info": {
    "device_type": "mobile",
    "os": "iOS",
    "app_version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "traveler",
      "whatsapp": "+237690000000",
      "avatar_url": "https://cdn.ganitel.com/avatars/user.jpg",
      "email_verified": true,
      "whatsapp_verified": true
    }
  }
}
```

### **POST /auth/refresh**
Refresh access token using refresh token.

**Headers:** `Authorization: Bearer {refresh_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

### **GET /auth/me**
Get current user profile.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "whatsapp": "+237690000000",
    "first_name": "Jean",
    "last_name": "Dupont",
    "avatar_url": "https://cdn.ganitel.com/avatars/user.jpg",
    "role": "traveler",
    "status": "active",
    "profile": {
      "bio": "Travel enthusiast from Paris",
      "interests": ["culture", "food", "adventure"],
      "dietary_restrictions": ["vegetarian"],
      "emergency_contact_name": "Marie Dupont",
      "emergency_contact_phone": "+33123456789"
    },
    "preferences": {
      "language": "fr",
      "currency": "EUR",
      "timezone": "Europe/Paris"
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### **PUT /auth/profile**
Update user profile.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "first_name": "Jean-Claude",
  "last_name": "Dupont",
  "bio": "Updated bio",
  "interests": ["culture", "food", "adventure", "wellness"],
  "preferences": {
    "language": "fr",
    "currency": "EUR"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully",
    "user": {
      // Updated user object
    }
  }
}
```

### **POST /auth/logout**
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

---

## 🏢 Services API

### **GET /services**
Search and list services with filtering.

**Query Parameters:**
- `category` (string): Service category code
- `city` (string): City name
- `region` (string): Region name
- `start_date` (date): Start date for availability
- `end_date` (date): End date for availability
- `participants` (integer): Number of participants
- `min_price` (decimal): Minimum price filter
- `max_price` (decimal): Maximum price filter
- `featured` (boolean): Only featured services
- `sort` (string): Sort by (price_asc, price_desc, rating, newest)
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service-123",
        "title": "Luxury Villa in Yaoundé",
        "slug": "luxury-villa-yaounde",
        "category": {
          "id": "cat-123",
          "code": "accommodation",
          "name": "Accommodation"
        },
        "provider": {
          "id": "provider-123",
          "business_name": "Villa Paradise",
          "average_rating": 4.8,
          "total_reviews": 127
        },
        "description": "Beautiful villa with pool and garden",
        "short_description": "3BR villa with modern amenities",
        "base_price": 85000,
        "currency": "XAF",
        "price_unit": "per_night",
        "capacity": 6,
        "location": {
          "address": "Bastos, Yaoundé",
          "city": "Yaoundé",
          "region": "Centre",
          "country": "Cameroon",
          "coordinates": {
            "latitude": 3.848,
            "longitude": 11.502
          }
        },
        "images": [
          {
            "id": "img-123",
            "url": "https://cdn.ganitel.com/services/villa-1.jpg",
            "thumbnail_url": "https://cdn.ganitel.com/services/villa-1-thumb.jpg",
            "alt_text": "Villa exterior view",
            "is_primary": true
          }
        ],
        "amenities": ["wifi", "pool", "parking", "air_conditioning"],
        "average_rating": 4.7,
        "total_reviews": 23,
        "instant_booking": true,
        "featured": false,
        "status": "active",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "has_next": true,
      "has_prev": false
    },
    "filters_applied": {
      "category": "accommodation",
      "city": "Yaoundé",
      "participants": 4
    }
  }
}
```

### **GET /services/{service_id}**
Get detailed service information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "service-123",
    "title": "Luxury Villa in Yaoundé",
    "slug": "luxury-villa-yaounde",
    "category": {
      "id": "cat-123",
      "code": "accommodation",
      "name": "Accommodation"
    },
    "provider": {
      "id": "provider-123",
      "business_name": "Villa Paradise",
      "business_description": "Premium accommodation provider",
      "verification_status": "verified",
      "average_rating": 4.8,
      "total_reviews": 127,
      "response_rate": 95,
      "response_time": "within 1 hour",
      "joined_at": "2024-06-15T10:30:00Z"
    },
    "description": "Beautiful villa with pool and garden...",
    "short_description": "3BR villa with modern amenities",
    "base_price": 85000,
    "currency": "XAF",
    "price_unit": "per_night",
    "capacity": 6,
    "minimum_booking_duration": 1,
    "maximum_booking_duration": 30,
    "booking_advance_notice": 24,
    "cancellation_policy": "moderate",
    "instant_booking": true,
    "location": {
      "address": "Bastos, Yaoundé",
      "city": "Yaoundé",
      "region": "Centre",
      "country": "Cameroon",
      "coordinates": {
        "latitude": 3.848,
        "longitude": 11.502
      }
    },
    "images": [
      {
        "id": "img-123",
        "url": "https://cdn.ganitel.com/services/villa-1.jpg",
        "thumbnail_url": "https://cdn.ganitel.com/services/villa-1-thumb.jpg",
        "alt_text": "Villa exterior view",
        "caption": "Beautiful exterior with garden",
        "is_primary": true,
        "sort_order": 0
      }
    ],
    "amenities": [
      {
        "id": "amenity-wifi",
        "name": "WiFi",
        "icon": "wifi",
        "category": "technology"
      }
    ],
    "house_rules": [
      "Check-in: 3:00 PM - 10:00 PM",
      "Check-out: 11:00 AM",
      "No smoking",
      "No pets"
    ],
    "service_specific": {
      "property_type": "villa",
      "bedrooms": 3,
      "bathrooms": 2,
      "beds": 4,
      "square_meters": 180,
      "check_in_time": "15:00:00",
      "check_out_time": "11:00:00"
    },
    "availability_calendar": [
      {
        "date": "2025-09-20",
        "available": true,
        "price": 85000
      },
      {
        "date": "2025-09-21",
        "available": false,
        "reason": "booked"
      }
    ],
    "pricing": {
      "base_price": 85000,
      "cleaning_fee": 15000,
      "service_fee": 8500,
      "taxes": 5100,
      "seasonal_adjustments": [
        {
          "start_date": "2025-12-20",
          "end_date": "2025-01-05",
          "adjustment_type": "percentage",
          "adjustment_value": 25,
          "reason": "Holiday season"
        }
      ]
    },
    "reviews_summary": {
      "average_rating": 4.7,
      "total_reviews": 23,
      "rating_breakdown": {
        "5_stars": 18,
        "4_stars": 4,
        "3_stars": 1,
        "2_stars": 0,
        "1_star": 0
      },
      "category_ratings": {
        "cleanliness": 4.8,
        "communication": 4.9,
        "value": 4.5,
        "location": 4.6
      }
    },
    "recent_reviews": [
      {
        "id": "review-123",
        "reviewer": {
          "first_name": "Marie",
          "avatar_url": "https://cdn.ganitel.com/avatars/marie.jpg"
        },
        "overall_rating": 5,
        "comment": "Amazing stay! Highly recommended.",
        "created_at": "2025-09-15T14:20:00Z"
      }
    ],
    "similar_services": [
      {
        "id": "service-456",
        "title": "Modern Apartment",
        "base_price": 65000,
        "average_rating": 4.5,
        "image_url": "https://cdn.ganitel.com/services/apt-1.jpg"
      }
    ],
    "status": "active",
    "featured": false,
    "views_count": 1847,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-09-15T16:45:00Z"
  }
}
```

### **POST /services** 🔒
Create a new service (Provider only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "category_id": "cat-123",
  "title": "Cozy Apartment in Douala",
  "description": "Beautiful 2-bedroom apartment...",
  "short_description": "2BR apartment with city view",
  "base_price": 65000,
  "currency": "XAF",
  "price_unit": "per_night",
  "capacity": 4,
  "location": {
    "address": "Bonanjo, Douala",
    "city": "Douala",
    "region": "Littoral",
    "latitude": 4.0511,
    "longitude": 9.7679
  },
  "amenities": ["wifi", "air_conditioning", "parking"],
  "service_specific": {
    "property_type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "beds": 2,
    "check_in_time": "15:00:00",
    "check_out_time": "11:00:00"
  },
  "house_rules": [
    "No smoking",
    "Quiet hours: 10 PM - 8 AM"
  ],
  "cancellation_policy": "moderate",
  "instant_booking": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "service-789",
    "title": "Cozy Apartment in Douala",
    "status": "draft",
    "message": "Service created successfully. Submit for review to make it live.",
    "next_steps": [
      "Add high-quality photos",
      "Set availability calendar",
      "Submit for admin review"
    ]
  }
}
```

### **PUT /services/{service_id}** 🔒
Update service (Provider only, own services).

**Headers:** `Authorization: Bearer {access_token}`

**Request:** (Partial update supported)
```json
{
  "title": "Updated Cozy Apartment in Douala",
  "base_price": 70000,
  "description": "Updated description..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Service updated successfully",
    "service": {
      // Updated service object
    }
  }
}
```

### **GET /services/{service_id}/availability**
Check service availability for specific dates.

**Query Parameters:**
- `start_date` (date, required): Check-in date
- `end_date` (date, required): Check-out date
- `participants` (integer): Number of participants

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "availability_details": [
      {
        "date": "2025-09-20",
        "available": true,
        "price": 85000,
        "minimum_stay": 1
      },
      {
        "date": "2025-09-21",
        "available": true,
        "price": 85000,
        "minimum_stay": 1
      }
    ],
    "total_nights": 2,
    "base_total": 170000,
    "pricing_breakdown": {
      "accommodation": 170000,
      "cleaning_fee": 15000,
      "service_fee": 18500,
      "taxes": 10200,
      "total": 213700
    },
    "booking_policies": {
      "cancellation_policy": "moderate",
      "minimum_advance_booking": 24,
      "maximum_stay": 30
    }
  }
}
```

---

## 📦 Packages API

### **GET /packages**
Search and list travel packages.

**Query Parameters:**
- `destination` (string): Destination city/region
- `duration` (integer): Package duration in days
- `min_price`, `max_price` (decimal): Price range
- `package_type` (string): Package type
- `participants` (integer): Number of participants
- `start_date` (date): Preferred start date
- `sort` (string): Sort order
- `page`, `limit` (integer): Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "package-123",
        "title": "Cameroon Cultural Discovery",
        "slug": "cameroon-cultural-discovery",
        "provider": {
          "id": "provider-456",
          "business_name": "Adventure Tours Cameroon",
          "average_rating": 4.9
        },
        "description": "5-day cultural immersion...",
        "short_description": "Explore traditional villages and museums",
        "package_type": "cultural",
        "duration_days": 5,
        "duration_nights": 4,
        "min_participants": 2,
        "max_participants": 8,
        "base_price": 450000,
        "currency": "XAF",
        "price_per_person": true,
        "discount_percentage": 10,
        "final_price": 405000,
        "included_services": [
          "Accommodation (4 nights)",
          "All meals",
          "Transportation",
          "Guide services",
          "Museum entries"
        ],
        "excluded_services": [
          "International flights",
          "Personal expenses",
          "Travel insurance"
        ],
        "images": [
          {
            "url": "https://cdn.ganitel.com/packages/cultural-1.jpg",
            "is_primary": true
          }
        ],
        "itinerary_preview": [
          {
            "day": 1,
            "title": "Arrival in Yaoundé",
            "activities": ["Airport pickup", "City tour", "Welcome dinner"]
          }
        ],
        "customizable": true,
        "average_rating": 4.8,
        "total_reviews": 45,
        "total_bookings": 156,
        "next_available_date": "2025-10-15",
        "created_at": "2025-01-20T10:30:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 75
    }
  }
}
```

### **GET /packages/{package_id}**
Get detailed package information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "package-123",
    "title": "Cameroon Cultural Discovery",
    "slug": "cameroon-cultural-discovery",
    "provider": {
      "id": "provider-456",
      "business_name": "Adventure Tours Cameroon",
      "business_description": "Authentic cultural experiences",
      "verification_status": "verified",
      "average_rating": 4.9,
      "total_reviews": 234
    },
    "description": "Immerse yourself in the rich cultural heritage...",
    "package_type": "cultural",
    "duration_days": 5,
    "duration_nights": 4,
    "min_participants": 2,
    "max_participants": 8,
    "base_price": 450000,
    "currency": "XAF",
    "price_per_person": true,
    "discount_percentage": 10,
    "final_price": 405000,
    "seasonal_pricing": [
      {
        "season": "High Season",
        "start_date": "2025-12-15",
        "end_date": "2026-01-15",
        "price_adjustment": 25,
        "adjustment_type": "percentage"
      }
    ],
    "included_services": [
      "4-star accommodation (4 nights)",
      "All meals (breakfast, lunch, dinner)",
      "Private transportation",
      "Professional guide services",
      "Museum and site entries",
      "Traditional craft workshop"
    ],
    "excluded_services": [
      "International flights to/from Cameroon",
      "Personal expenses and souvenirs",
      "Travel insurance",
      "Visa fees",
      "Optional activities"
    ],
    "detailed_itinerary": [
      {
        "day": 1,
        "title": "Arrival & Yaoundé Exploration",
        "description": "Welcome to Cameroon's capital",
        "activities": [
          {
            "time": "09:00",
            "activity": "Airport pickup",
            "duration": 60,
            "location": "Nsimalen International Airport"
          },
          {
            "time": "11:00",
            "activity": "Hotel check-in",
            "duration": 30,
            "location": "Hilton Yaoundé"
          },
          {
            "time": "14:00",
            "activity": "National Museum visit",
            "duration": 120,
            "location": "National Museum of Yaoundé"
          }
        ],
        "meals": ["lunch", "dinner"],
        "accommodation": "Hilton Yaoundé"
      }
    ],
    "customization_options": {
      "accommodation_upgrades": [
        {
          "option": "5-star luxury hotels",
          "additional_cost": 150000,
          "description": "Upgrade to premium accommodations"
        }
      ],
      "optional_activities": [
        {
          "activity": "Traditional cooking class",
          "cost": 35000,
          "duration": 180,
          "description": "Learn to cook traditional Cameroonian dishes"
        }
      ],
      "transportation_options": [
        {
          "option": "Private vehicle with driver",
          "additional_cost": 75000,
          "description": "Exclusive transportation"
        }
      ]
    },
    "booking_policies": {
      "booking_deadline": 72,
      "cancellation_policy": "moderate",
      "payment_terms": "30% deposit, balance 14 days before departure",
      "age_restrictions": {
        "minimum_age": 8,
        "child_discount": 25
      }
    },
    "what_to_bring": [
      "Comfortable walking shoes",
      "Light rain jacket",
      "Sun hat and sunscreen",
      "Camera",
      "Casual and modest clothing"
    ],
    "images": [
      {
        "id": "img-789",
        "url": "https://cdn.ganitel.com/packages/cultural-hero.jpg",
        "thumbnail_url": "https://cdn.ganitel.com/packages/cultural-hero-thumb.jpg",
        "alt_text": "Traditional dancers",
        "caption": "Experience authentic cultural performances",
        "is_primary": true
      }
    ],
    "reviews_summary": {
      "average_rating": 4.8,
      "total_reviews": 45,
      "recent_reviews": [
        {
          "id": "review-789",
          "reviewer": "Sophie L.",
          "overall_rating": 5,
          "comment": "Incredible cultural experience!",
          "created_at": "2025-09-10T15:30:00Z"
        }
      ]
    },
    "availability": {
      "next_available_date": "2025-10-15",
      "available_dates": [
        "2025-10-15",
        "2025-10-22",
        "2025-11-05"
      ]
    },
    "status": "active",
    "created_at": "2025-01-20T10:30:00Z"
  }
}
```

### **POST /packages/{package_id}/customize** 🔒
Customize a package before booking.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "selected_customizations": {
    "accommodation_upgrade": "5-star luxury hotels",
    "optional_activities": ["Traditional cooking class"],
    "transportation": "Private vehicle with driver"
  },
  "participant_count": 4,
  "preferred_start_date": "2025-11-05",
  "special_requests": "Vegetarian meals preferred"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customized_package": {
      "base_package_id": "package-123",
      "customization_id": "custom-789",
      "title": "Cameroon Cultural Discovery (Customized)",
      "original_price": 405000,
      "customization_costs": 260000,
      "final_price": 665000,
      "price_per_person": true,
      "total_for_group": 2660000,
      "customizations_applied": [
        {
          "type": "accommodation_upgrade",
          "name": "5-star luxury hotels",
          "cost": 150000
        },
        {
          "type": "optional_activity",
          "name": "Traditional cooking class",
          "cost": 35000
        },
        {
          "type": "transportation",
          "name": "Private vehicle with driver",
          "cost": 75000
        }
      ],
      "updated_itinerary": [
        // Modified itinerary with customizations
      ],
      "valid_until": "2025-09-25T10:30:00Z" // 24 hours to book
    }
  }
}
```

---

## 🛒 Shopping Cart API

### **GET /cart** 🔒
Get current user's cart contents.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_id": "cart-123",
    "items": [
      {
        "id": "cart-item-456",
        "item_type": "service",
        "service": {
          "id": "service-123",
          "title": "Luxury Villa in Yaoundé",
          "category": "accommodation",
          "provider_name": "Villa Paradise",
          "images": [
            {
              "url": "https://cdn.ganitel.com/services/villa-1-thumb.jpg",
              "is_primary": true
            }
          ]
        },
        "booking_details": {
          "start_date": "2025-10-15",
          "end_date": "2025-10-18",
          "participants": 4,
          "nights": 3
        },
        "pricing": {
          "unit_price": 85000,
          "quantity": 3,
          "subtotal": 255000,
          "fees": 25500,
          "taxes": 15300,
          "total": 295800
        },
        "special_requests": "Late check-in preferred",
        "added_at": "2025-09-18T14:20:00Z",
        "expires_at": "2025-09-19T14:20:00Z"
      },
      {
        "id": "cart-item-789",
        "item_type": "package",
        "package": {
          "id": "package-123",
          "title": "Cameroon Cultural Discovery",
          "provider_name": "Adventure Tours Cameroon",
          "duration_days": 5,
          "customization_id": "custom-789"
        },
        "booking_details": {
          "start_date": "2025-11-05",
          "participants": 4
        },
        "pricing": {
          "base_price": 405000,
          "customization_costs": 260000,
          "unit_price": 665000,
          "quantity": 4,
          "subtotal": 2660000,
          "group_discount": 133000,
          "total": 2527000
        },
        "added_at": "2025-09-18T15:45:00Z",
        "expires_at": "2025-09-19T15:45:00Z"
      }
    ],
    "cart_summary": {
      "total_items": 2,
      "subtotal": 2915000,
      "total_fees": 25500,
      "total_taxes": 15300,
      "total_discounts": 133000,
      "grand_total": 2822800,
      "currency": "XAF",
      "estimated_commission": 282280
    },
    "date_conflicts": [],
    "availability_warnings": [
      {
        "item_id": "cart-item-456",
        "message": "Only 2 rooms left for selected dates",
        "severity": "warning"
      }
    ],
    "expires_at": "2025-09-19T14:20:00Z"
  }
}
```

### **POST /cart/items** 🔒
Add item to cart.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "item_type": "service", // "service" or "package"
  "service_id": "service-123", // Required if item_type is "service"
  "package_id": null, // Required if item_type is "package"
  "customization_id": null, // Required if adding customized package
  "booking_details": {
    "start_date": "2025-10-15",
    "end_date": "2025-10-18",
    "start_time": null, // For services that need specific time
    "participants": 4
  },
  "special_requests": "Late check-in preferred",
  "auto_remove_conflicts": false // Whether to remove conflicting items
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_item": {
      "id": "cart-item-new",
      "item_type": "service",
      "service_id": "service-123",
      "pricing": {
        "unit_price": 85000,
        "quantity": 3,
        "total": 255000
      },
      "added_at": "2025-09-18T16:30:00Z",
      "expires_at": "2025-09-19T16:30:00Z"
    },
    "cart_summary": {
      "total_items": 3,
      "grand_total": 3077800
    },
    "conflicts": [], // Any date or availability conflicts
    "recommendations": [
      {
        "type": "upsell",
        "service_id": "service-456",
        "message": "Add airport transfer for convenient arrival"
      }
    ]
  }
}
```

### **PUT /cart/items/{item_id}** 🔒
Update cart item.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "booking_details": {
    "start_date": "2025-10-16",
    "end_date": "2025-10-19",
    "participants": 6
  },
  "special_requests": "Ground floor room preferred"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cart item updated successfully",
    "cart_item": {
      // Updated cart item
    },
    "pricing_changes": {
      "old_total": 255000,
      "new_total": 340000,
      "difference": 85000
    }
  }
}
```

### **DELETE /cart/items/{item_id}** 🔒
Remove item from cart.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Item removed from cart",
    "cart_summary": {
      "total_items": 1,
      "grand_total": 2527000
    }
  }
}
```

### **DELETE /cart** 🔒
Clear entire cart.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cart cleared successfully"
  }
}
```

---

## 📝 Bookings API

### **POST /bookings** 🔒
Create booking from cart or direct booking.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "booking_source": "cart", // "cart" or "direct"
  "cart_item_ids": ["cart-item-456", "cart-item-789"], // If from cart
  "service_id": null, // If direct service booking
  "package_id": null, // If direct package booking
  "guest_details": {
    "primary_guest": {
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean@example.com",
      "phone": "+237690000000"
    },
    "additional_guests": [
      {
        "first_name": "Marie",
        "last_name": "Dupont",
        "age": 35
      }
    ]
  },
  "payment_method": "mobile_money_mtn",
  "payment_phone": "+237690000000",
  "marketing_consent": true,
  "terms_accepted": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking-123",
        "booking_number": "GAN-2025-001234",
        "service_id": "service-123",
        "provider_id": "provider-456",
        "status": "pending_payment",
        "payment_status": "pending",
        "booking_details": {
          "start_date": "2025-10-15",
          "end_date": "2025-10-18",
          "participants": 4
        },
        "pricing": {
          "subtotal": 255000,
          "fees": 25500,
          "taxes": 15300,
          "total": 295800,
          "currency": "XAF"
        },
        "payment_deadline": "2025-09-19T16:30:00Z",
        "confirmation_deadline": "2025-09-20T10:00:00Z"
      }
    ],
    "payment_intent": {
      "id": "pi-123456",
      "amount": 295800,
      "currency": "XAF",
      "payment_method": "mobile_money_mtn",
      "payment_url": "https://payment.tranzak.com/pay/pi-123456",
      "expires_at": "2025-09-18T17:00:00Z"
    },
    "next_steps": [
      "Complete payment within 30 minutes",
      "Wait for provider confirmation",
      "Receive booking confirmation via WhatsApp"
    ]
  }
}
```

### **GET /bookings** 🔒
Get user's bookings with filtering.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `status` (string): Filter by booking status
- `start_date`, `end_date` (date): Filter by date range
- `provider_id` (uuid): Filter by provider
- `sort` (string): Sort order
- `page`, `limit` (integer): Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking-123",
        "booking_number": "GAN-2025-001234",
        "booking_type": "service",
        "service": {
          "id": "service-123",
          "title": "Luxury Villa in Yaoundé",
          "category": "accommodation",
          "images": [
            {
              "url": "https://cdn.ganitel.com/services/villa-1-thumb.jpg",
              "is_primary": true
            }
          ]
        },
        "provider": {
          "id": "provider-456",
          "business_name": "Villa Paradise",
          "contact_phone": "+237690111111"
        },
        "booking_details": {
          "start_date": "2025-10-15",
          "end_date": "2025-10-18",
          "start_time": null,
          "participants": 4,
          "nights": 3
        },
        "pricing": {
          "subtotal": 255000,
          "fees": 25500,
          "taxes": 15300,
          "total": 295800,
          "currency": "XAF"
        },
        "status": "confirmed",
        "payment_status": "paid",
        "guest_message": "Looking forward to our stay!",
        "provider_response": "Welcome! Check-in instructions will be sent 24h before arrival.",
        "important_dates": {
          "booking_date": "2025-09-18T16:45:00Z",
          "payment_date": "2025-09-18T17:02:00Z",
          "confirmation_date": "2025-09-18T17:15:00Z",
          "cancellation_deadline": "2025-10-13T15:00:00Z"
        },
        "actions_available": [
          "view_details",
          "contact_provider",
          "modify_booking",
          "cancel_booking",
          "leave_review"
        ]
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12
    },
    "status_counts": {
      "pending": 2,
      "confirmed": 8,
      "completed": 15,
      "cancelled": 3
    }
  }
}
```

### **GET /bookings/{booking_id}** 🔒
Get detailed booking information.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking-123",
    "booking_number": "GAN-2025-001234",
    "booking_type": "service",
    "service": {
      "id": "service-123",
      "title": "Luxury Villa in Yaoundé",
      "description": "Beautiful villa with pool and garden",
      "category": "accommodation",
      "location": {
        "address": "Bastos, Yaoundé",
        "coordinates": {
          "latitude": 3.848,
          "longitude": 11.502
        }
      },
      "images": [
        {
          "url": "https://cdn.ganitel.com/services/villa-1.jpg",
          "is_primary": true
        }
      ],
      "amenities": ["wifi", "pool", "parking", "air_conditioning"],
      "house_rules": [
        "Check-in: 3:00 PM - 10:00 PM",
        "Check-out: 11:00 AM",
        "No smoking"
      ],
      "check_in_instructions": "Call host 1 hour before arrival. Key safe code will be provided."
    },
    "provider": {
      "id": "provider-456",
      "business_name": "Villa Paradise",
      "contact_phone": "+237690111111",
      "contact_whatsapp": "+237690111111",
      "emergency_contact": "+237690111112",
      "response_rate": 98,
      "average_rating": 4.8
    },
    "guest_details": {
      "primary_guest": {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean@example.com",
        "phone": "+237690000000"
      },
      "additional_guests": [
        {
          "first_name": "Marie",
          "last_name": "Dupont",
          "age": 35
        },
        {
          "first_name": "Pierre",
          "last_name": "Dupont",
          "age": 12
        }
      ],
      "total_guests": 3
    },
    "booking_details": {
      "start_date": "2025-10-15",
      "end_date": "2025-10-18",
      "start_time": null,
      "end_time": null,
      "participants": 4,
      "duration": {
        "nights": 3,
        "days": 4
      },
      "special_requests": "Ground floor accommodation if possible"
    },
    "pricing": {
      "base_amount": 255000,
      "breakdown": {
        "accommodation_3_nights": 255000,
        "cleaning_fee": 15000,
        "service_fee": 25500,
        "taxes": 15300
      },
      "subtotal": 255000,
      "fees": 40500,
      "taxes": 15300,
      "discounts": 0,
      "total": 310800,
      "currency": "XAF"
    },
    "payment_details": {
      "payment_method": "mobile_money_mtn",
      "payment_status": "paid",
      "payment_date": "2025-09-18T17:02:00Z",
      "payment_reference": "TRZ-123456789",
      "amount_paid": 310800,
      "refund_eligible": true,
      "refund_amount": 217560 // After cancellation policy
    },
    "status": "confirmed",
    "status_history": [
      {
        "status": "pending_payment",
        "timestamp": "2025-09-18T16:45:00Z",
        "note": "Booking created, awaiting payment"
      },
      {
        "status": "pending_confirmation",
        "timestamp": "2025-09-18T17:02:00Z",
        "note": "Payment received, awaiting provider confirmation"
      },
      {
        "status": "confirmed",
        "timestamp": "2025-09-18T17:15:00Z",
        "note": "Provider confirmed booking"
      }
    ],
    "communication": {
      "guest_message": "Looking forward to our stay! Any recommendations for local restaurants?",
      "provider_response": "Welcome! I've sent a list of recommended restaurants via WhatsApp. Check-in instructions will follow 24h before arrival.",
      "last_message_at": "2025-09-18T18:30:00Z",
      "unread_messages": 0
    },
    "important_dates": {
      "booking_created": "2025-09-18T16:45:00Z",
      "payment_deadline": "2025-09-18T17:15:00Z",
      "confirmation_deadline": "2025-09-19T10:00:00Z",
      "cancellation_deadline": "2025-10-13T15:00:00Z",
      "check_in": "2025-10-15T15:00:00Z",
      "check_out": "2025-10-18T11:00:00Z"
    },
    "cancellation_policy": {
      "policy_type": "moderate",
      "free_cancellation_until": "2025-10-13T15:00:00Z",
      "refund_schedule": [
        {
          "period": "More than 48 hours before check-in",
          "refund_percentage": 100
        },
        {
          "period": "24-48 hours before check-in",
          "refund_percentage": 50
        },
        {
          "period": "Less than 24 hours",
          "refund_percentage": 0
        }
      ]
    },
    "actions_available": [
      {
        "action": "modify_booking",
        "available": true,
        "restrictions": ["No date changes within 7 days of check-in"]
      },
      {
        "action": "cancel_booking",
        "available": true,
        "refund_amount": 217560
      },
      {
        "action": "contact_provider",
        "available": true,
        "methods": ["whatsapp", "phone", "platform_message"]
      }
    ],
    "documents": [
      {
        "type": "booking_confirmation",
        "url": "https://cdn.ganitel.com/documents/booking-123-confirmation.pdf",
        "generated_at": "2025-09-18T17:20:00Z"
      },
      {
        "type": "payment_receipt",
        "url": "https://cdn.ganitel.com/documents/booking-123-receipt.pdf",
        "generated_at": "2025-09-18T17:05:00Z"
      }
    ]
  }
}
```

This comprehensive API documentation provides everything the frontend team needs to integrate with the Ganitel backend. The next sections will cover the remaining endpoints including reviews, payments, messaging, and admin APIs.