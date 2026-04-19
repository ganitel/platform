# Ganitel — Complete REST API Documentation (Part 2)

This is the continuation of the comprehensive API documentation for the Ganitel platform.

---

## 📝 Reviews & Ratings API

### **GET /reviews**
Get reviews with filtering.

**Query Parameters:**
- `service_id` (uuid): Filter by service
- `provider_id` (uuid): Filter by provider
- `booking_id` (uuid): Filter by booking
- `rating` (integer): Filter by rating (1-5)
- `sort` (string): Sort order (newest, oldest, rating_high, rating_low)
- `page`, `limit` (integer): Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-123",
        "booking": {
          "id": "booking-456",
          "booking_number": "GAN-2025-001234",
          "service_title": "Luxury Villa in Yaoundé"
        },
        "service": {
          "id": "service-123",
          "title": "Luxury Villa in Yaoundé",
          "category": "accommodation"
        },
        "provider": {
          "id": "provider-456",
          "business_name": "Villa Paradise"
        },
        "reviewer": {
          "id": "user-789",
          "first_name": "Marie",
          "avatar_url": "https://cdn.ganitel.com/avatars/marie.jpg",
          "review_count": 15,
          "average_rating_given": 4.2
        },
        "overall_rating": 5,
        "category_ratings": {
          "cleanliness": 5,
          "communication": 5,
          "value": 4,
          "location": 5,
          "accuracy": 5
        },
        "review_text": "Absolutely amazing experience! The villa was even better than the photos. Perfect location and the host was incredibly helpful.",
        "photos": [
          {
            "url": "https://cdn.ganitel.com/reviews/photo-1.jpg",
            "thumbnail_url": "https://cdn.ganitel.com/reviews/photo-1-thumb.jpg",
            "caption": "Beautiful pool area"
          }
        ],
        "stay_details": {
          "check_in_date": "2025-09-10",
          "check_out_date": "2025-09-13",
          "nights": 3,
          "group_size": 4
        },
        "helpful_count": 12,
        "verified_stay": true,
        "provider_response": {
          "response_text": "Thank you so much for your kind words! We're delighted you enjoyed your stay.",
          "response_date": "2025-09-16T10:30:00Z"
        },
        "created_at": "2025-09-15T14:20:00Z",
        "updated_at": "2025-09-15T14:20:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 127
    },
    "average_rating": 4.7,
    "rating_distribution": {
      "5_stars": 89,
      "4_stars": 28,
      "3_stars": 8,
      "2_stars": 2,
      "1_star": 0
    }
  }
}
```

### **POST /bookings/{booking_id}/review** 🔒
Submit review for completed booking.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "overall_rating": 5,
  "category_ratings": {
    "cleanliness": 5,
    "communication": 5,
    "value": 4,
    "location": 5,
    "accuracy": 5
  },
  "review_text": "Absolutely amazing experience! The villa was even better than the photos.",
  "photos": [
    {
      "url": "https://cdn.ganitel.com/uploads/review-photo-1.jpg",
      "caption": "Beautiful pool area"
    }
  ],
  "anonymous": false,
  "would_recommend": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "review-new",
      "overall_rating": 5,
      "review_text": "Absolutely amazing experience!",
      "status": "published",
      "created_at": "2025-09-18T16:45:00Z"
    },
    "impact": {
      "provider_new_average": 4.8,
      "service_new_average": 4.7,
      "review_count_increase": 1
    },
    "rewards": {
      "points_earned": 50,
      "badge_unlocked": null
    }
  }
}
```

### **PUT /reviews/{review_id}** 🔒
Update review (reviewer only, within edit window).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "overall_rating": 4,
  "review_text": "Updated review text...",
  "category_ratings": {
    "cleanliness": 4,
    "communication": 5,
    "value": 4,
    "location": 5,
    "accuracy": 4
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Review updated successfully",
    "review": {
      // Updated review object
    },
    "edit_deadline": "2025-09-25T16:45:00Z"
  }
}
```

### **POST /reviews/{review_id}/helpful** 🔒
Mark review as helpful.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "helpful_count": 13,
    "user_found_helpful": true
  }
}
```

### **POST /reviews/{review_id}/respond** 🔒
Respond to review (Provider only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "response_text": "Thank you so much for your kind words! We're delighted you enjoyed your stay."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Response posted successfully",
    "response": {
      "response_text": "Thank you so much for your kind words!",
      "response_date": "2025-09-18T17:00:00Z"
    }
  }
}
```

---

## 💳 Payments API

### **GET /payments/methods** 🔒
Get available payment methods for user.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "available_methods": [
      {
        "id": "mobile_money_mtn",
        "name": "MTN Mobile Money",
        "provider": "mtn",
        "type": "mobile_money",
        "logo_url": "https://cdn.ganitel.com/payment-logos/mtn.png",
        "currencies": ["XAF"],
        "fees": {
          "percentage": 2.5,
          "fixed": 150,
          "description": "2.5% + 150 XAF per transaction"
        },
        "limits": {
          "min_amount": 1000,
          "max_amount": 2000000,
          "daily_limit": 5000000
        },
        "processing_time": "instant",
        "available": true
      },
      {
        "id": "mobile_money_orange",
        "name": "Orange Money",
        "provider": "orange",
        "type": "mobile_money",
        "logo_url": "https://cdn.ganitel.com/payment-logos/orange.png",
        "currencies": ["XAF"],
        "fees": {
          "percentage": 2.5,
          "fixed": 150,
          "description": "2.5% + 150 XAF per transaction"
        },
        "limits": {
          "min_amount": 1000,
          "max_amount": 1500000,
          "daily_limit": 3000000
        },
        "processing_time": "instant",
        "available": true
      },
      {
        "id": "card_visa",
        "name": "Visa Card",
        "provider": "visa",
        "type": "card",
        "logo_url": "https://cdn.ganitel.com/payment-logos/visa.png",
        "currencies": ["XAF", "USD", "EUR"],
        "fees": {
          "percentage": 3.5,
          "fixed": 0,
          "description": "3.5% per transaction"
        },
        "processing_time": "instant",
        "available": true
      }
    ],
    "recommended_method": "mobile_money_mtn",
    "currency_exchange": {
      "user_currency": "EUR",
      "platform_currency": "XAF",
      "exchange_rate": 655.957,
      "rate_updated_at": "2025-09-18T16:00:00Z"
    }
  }
}
```

### **POST /payments/intents** 🔒
Create payment intent.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "amount": 295800,
  "currency": "XAF",
  "payment_method": "mobile_money_mtn",
  "payment_phone": "+237690000000",
  "booking_ids": ["booking-123", "booking-456"],
  "description": "Payment for Ganitel bookings",
  "return_url": "https://app.ganitel.com/payment-success",
  "cancel_url": "https://app.ganitel.com/payment-cancelled"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_intent": {
      "id": "pi-123456789",
      "status": "requires_payment_method",
      "amount": 295800,
      "currency": "XAF",
      "payment_method": "mobile_money_mtn",
      "payment_url": "https://payment.tranzak.com/pay/pi-123456789",
      "client_secret": "pi_123456789_secret_abc123",
      "expires_at": "2025-09-18T17:30:00Z",
      "metadata": {
        "booking_ids": ["booking-123", "booking-456"],
        "user_id": "user-789"
      }
    },
    "instructions": {
      "step_1": "You will be redirected to the payment page",
      "step_2": "Enter your MTN Mobile Money PIN",
      "step_3": "Confirm the payment on your phone",
      "step_4": "You will be redirected back to Ganitel"
    }
  }
}
```

### **GET /payments/intents/{intent_id}** 🔒
Get payment intent status.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_intent": {
      "id": "pi-123456789",
      "status": "succeeded",
      "amount": 295800,
      "amount_received": 295800,
      "currency": "XAF",
      "payment_method": "mobile_money_mtn",
      "payment_date": "2025-09-18T17:02:15Z",
      "transaction_reference": "TRZ-987654321",
      "provider_reference": "MTN-456789123",
      "fees_paid": 7545,
      "net_amount": 288255,
      "metadata": {
        "booking_ids": ["booking-123", "booking-456"]
      }
    },
    "related_bookings": [
      {
        "booking_id": "booking-123",
        "status": "confirmed",
        "amount": 295800
      }
    ]
  }
}
```

### **GET /payments/history** 🔒
Get user's payment history.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `status` (string): Filter by payment status
- `start_date`, `end_date` (date): Date range
- `method` (string): Payment method filter
- `page`, `limit` (integer): Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment-123",
        "payment_intent_id": "pi-123456789",
        "type": "booking_payment",
        "status": "completed",
        "amount": 295800,
        "currency": "XAF",
        "payment_method": "mobile_money_mtn",
        "payment_phone": "+237690000000",
        "transaction_reference": "TRZ-987654321",
        "provider_reference": "MTN-456789123",
        "booking": {
          "id": "booking-123",
          "booking_number": "GAN-2025-001234",
          "service_title": "Luxury Villa in Yaoundé"
        },
        "fees": 7545,
        "net_amount": 288255,
        "payment_date": "2025-09-18T17:02:15Z",
        "receipt_url": "https://cdn.ganitel.com/receipts/payment-123.pdf"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    },
    "summary": {
      "total_spent": 4567890,
      "total_transactions": 45,
      "average_transaction": 101508
    }
  }
}
```

### **POST /payments/{payment_id}/refund** 🔒
Request refund (Admin/Provider only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "amount": 147900, // Partial refund amount, null for full refund
  "reason": "booking_cancelled",
  "reason_detail": "Guest cancelled due to emergency",
  "refund_method": "original_method" // or "bank_transfer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refund": {
      "id": "refund-123",
      "payment_id": "payment-123",
      "amount": 147900,
      "currency": "XAF",
      "status": "processing",
      "refund_method": "mobile_money_mtn",
      "estimated_arrival": "2025-09-20T17:00:00Z",
      "refund_reference": "REF-789456123"
    },
    "original_payment": {
      "amount": 295800,
      "refunded_amount": 147900,
      "remaining_amount": 147900
    }
  }
}
```

---

## 💬 Messaging API

### **GET /conversations** 🔒
Get user's conversations.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `unread_only` (boolean): Show only unread conversations
- `booking_id` (uuid): Filter by booking
- `provider_id` (uuid): Filter by provider
- `page`, `limit` (integer): Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conversation-123",
        "type": "booking_inquiry",
        "participants": [
          {
            "id": "user-456",
            "first_name": "Jean",
            "last_name": "Dupont",
            "role": "traveler",
            "avatar_url": "https://cdn.ganitel.com/avatars/jean.jpg"
          },
          {
            "id": "provider-789",
            "business_name": "Villa Paradise",
            "role": "provider",
            "avatar_url": "https://cdn.ganitel.com/avatars/villa-paradise.jpg"
          }
        ],
        "related_booking": {
          "id": "booking-123",
          "booking_number": "GAN-2025-001234",
          "service_title": "Luxury Villa in Yaoundé",
          "status": "confirmed"
        },
        "last_message": {
          "id": "message-456",
          "sender_id": "provider-789",
          "content": "Check-in instructions have been sent to your WhatsApp!",
          "sent_at": "2025-09-18T15:30:00Z"
        },
        "unread_count": 0,
        "status": "active",
        "created_at": "2025-09-15T10:00:00Z",
        "updated_at": "2025-09-18T15:30:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8
    },
    "unread_total": 2
  }
}
```

### **GET /conversations/{conversation_id}/messages** 🔒
Get conversation messages.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `before` (datetime): Get messages before this timestamp
- `after` (datetime): Get messages after this timestamp
- `limit` (integer): Number of messages (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message-123",
        "conversation_id": "conversation-123",
        "sender": {
          "id": "user-456",
          "first_name": "Jean",
          "role": "traveler",
          "avatar_url": "https://cdn.ganitel.com/avatars/jean.jpg"
        },
        "content": "Hi! I have a question about check-in procedures.",
        "message_type": "text",
        "attachments": [],
        "read_by": [
          {
            "user_id": "provider-789",
            "read_at": "2025-09-18T10:35:00Z"
          }
        ],
        "sent_at": "2025-09-18T10:30:00Z",
        "edited_at": null,
        "status": "delivered"
      },
      {
        "id": "message-456",
        "conversation_id": "conversation-123",
        "sender": {
          "id": "provider-789",
          "business_name": "Villa Paradise",
          "role": "provider",
          "avatar_url": "https://cdn.ganitel.com/avatars/villa-paradise.jpg"
        },
        "content": "Hello Jean! Check-in is from 3 PM. I'll send detailed instructions to your WhatsApp 24 hours before your arrival.",
        "message_type": "text",
        "attachments": [],
        "read_by": [
          {
            "user_id": "user-456",
            "read_at": "2025-09-18T10:45:00Z"
          }
        ],
        "sent_at": "2025-09-18T10:40:00Z",
        "status": "read"
      },
      {
        "id": "message-789",
        "conversation_id": "conversation-123",
        "sender": {
          "id": "provider-789",
          "business_name": "Villa Paradise",
          "role": "provider"
        },
        "content": "Here's a welcome guide for your stay.",
        "message_type": "file",
        "attachments": [
          {
            "id": "attachment-123",
            "filename": "villa-welcome-guide.pdf",
            "file_type": "application/pdf",
            "file_size": 2456789,
            "url": "https://cdn.ganitel.com/attachments/villa-welcome-guide.pdf",
            "thumbnail_url": null
          }
        ],
        "sent_at": "2025-09-18T15:30:00Z",
        "status": "delivered"
      }
    ]
  },
  "meta": {
    "has_more": false,
    "total_messages": 8,
    "oldest_message_at": "2025-09-15T10:00:00Z",
    "newest_message_at": "2025-09-18T15:30:00Z"
  }
}
```

### **POST /conversations/{conversation_id}/messages** 🔒
Send message in conversation.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "content": "Thank you! Looking forward to our stay.",
  "message_type": "text",
  "attachments": [],
  "reply_to_message_id": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message-new",
      "content": "Thank you! Looking forward to our stay.",
      "message_type": "text",
      "sent_at": "2025-09-18T16:45:00Z",
      "status": "sent"
    },
    "conversation_updated": true
  }
}
```

### **POST /conversations** 🔒
Start new conversation.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "type": "booking_inquiry",
  "participant_ids": ["provider-789"],
  "booking_id": "booking-123",
  "initial_message": {
    "content": "Hello! I have a question about my upcoming booking.",
    "message_type": "text"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conversation-new",
      "type": "booking_inquiry",
      "participants": [
        // Participant objects
      ],
      "created_at": "2025-09-18T16:50:00Z"
    },
    "initial_message": {
      "id": "message-initial",
      "content": "Hello! I have a question about my upcoming booking.",
      "sent_at": "2025-09-18T16:50:00Z"
    }
  }
}
```

### **PUT /conversations/{conversation_id}/read** 🔒
Mark conversation as read.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "messages_marked_read": 3,
    "last_read_at": "2025-09-18T16:55:00Z"
  }
}
```

---

## 🏢 Provider Management API

### **POST /providers/register** 🔒
Register as service provider.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "business_name": "Villa Paradise",
  "business_description": "Premium vacation rentals in Yaoundé",
  "business_type": "individual", // "individual", "company", "agency"
  "registration_number": "CM-YA-2025-12345",
  "tax_id": "TAX123456789",
  "contact_info": {
    "business_phone": "+237690111111",
    "business_whatsapp": "+237690111111",
    "business_email": "info@villaparadise.cm",
    "website": "https://villaparadise.cm"
  },
  "address": {
    "street": "Rue de la Paix",
    "city": "Yaoundé",
    "region": "Centre",
    "postal_code": "BP 1234",
    "country": "Cameroon"
  },
  "bank_details": {
    "bank_name": "Société Générale Cameroun",
    "account_name": "Villa Paradise",
    "account_number": "10002000300040005",
    "swift_code": "SOGEKMCX"
  },
  "documents": [
    {
      "type": "business_license",
      "url": "https://cdn.ganitel.com/documents/business-license.pdf"
    },
    {
      "type": "id_card",
      "url": "https://cdn.ganitel.com/documents/id-card.pdf"
    }
  ],
  "terms_accepted": true,
  "commission_agreement_accepted": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "provider-new",
      "business_name": "Villa Paradise",
      "verification_status": "pending_review",
      "registration_date": "2025-09-18T17:00:00Z"
    },
    "next_steps": [
      "Document verification (1-3 business days)",
      "Account approval notification",
      "Complete provider profile setup",
      "List your first service"
    ],
    "estimated_approval_time": "3 business days"
  }
}
```

### **GET /providers/dashboard** 🔒
Provider dashboard overview.

**Headers:** `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "provider-123",
      "business_name": "Villa Paradise",
      "verification_status": "verified",
      "average_rating": 4.8,
      "total_reviews": 127,
      "response_rate": 95,
      "response_time": "within 1 hour"
    },
    "summary_stats": {
      "total_services": 5,
      "active_services": 4,
      "draft_services": 1,
      "total_bookings": 234,
      "confirmed_bookings": 198,
      "pending_bookings": 12,
      "total_revenue": 45600000,
      "current_month_revenue": 3800000,
      "average_booking_value": 195000
    },
    "recent_bookings": [
      {
        "id": "booking-456",
        "booking_number": "GAN-2025-001235",
        "service_title": "Luxury Villa in Yaoundé",
        "guest_name": "Marie Dubois",
        "check_in": "2025-09-20",
        "status": "confirmed",
        "total_amount": 310800,
        "unread_messages": 0
      }
    ],
    "pending_actions": [
      {
        "type": "booking_confirmation",
        "count": 2,
        "description": "New bookings awaiting confirmation"
      },
      {
        "type": "unread_messages",
        "count": 5,
        "description": "Unread guest messages"
      },
      {
        "type": "review_responses",
        "count": 3,
        "description": "Recent reviews to respond to"
      }
    ],
    "performance_metrics": {
      "occupancy_rate": 78,
      "booking_acceptance_rate": 92,
      "cancellation_rate": 3,
      "guest_satisfaction": 4.8
    }
  }
}
```

### **GET /providers/bookings** 🔒
Provider's bookings management.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `status` (string): Filter by booking status
- `service_id` (uuid): Filter by service
- `start_date`, `end_date` (date): Date range
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
        "service": {
          "id": "service-123",
          "title": "Luxury Villa in Yaoundé"
        },
        "guest": {
          "id": "user-456",
          "first_name": "Jean",
          "last_name": "Dupont",
          "phone": "+237690000000",
          "email": "jean@example.com",
          "avatar_url": "https://cdn.ganitel.com/avatars/jean.jpg"
        },
        "booking_details": {
          "start_date": "2025-10-15",
          "end_date": "2025-10-18",
          "participants": 4,
          "nights": 3,
          "special_requests": "Ground floor room preferred"
        },
        "pricing": {
          "total": 310800,
          "provider_earning": 279720, // After platform commission
          "platform_commission": 31080
        },
        "status": "confirmed",
        "payment_status": "paid",
        "unread_messages": 0,
        "requires_action": false,
        "created_at": "2025-09-18T16:45:00Z",
        "confirmed_at": "2025-09-18T17:15:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    },
    "status_summary": {
      "pending": 3,
      "confirmed": 35,
      "completed": 120,
      "cancelled": 7
    }
  }
}
```

### **PUT /providers/bookings/{booking_id}/confirm** 🔒
Confirm pending booking (Provider only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "confirmation_message": "Booking confirmed! Looking forward to hosting you. Check-in instructions will be sent 24 hours before arrival.",
  "special_instructions": "Please call 30 minutes before arrival for key collection."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking-123",
      "status": "confirmed",
      "confirmed_at": "2025-09-18T17:15:00Z"
    },
    "notifications_sent": [
      "guest_whatsapp",
      "guest_email",
      "platform_notification"
    ]
  }
}
```

### **PUT /providers/bookings/{booking_id}/decline** 🔒
Decline pending booking (Provider only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "decline_reason": "property_unavailable",
  "decline_message": "Unfortunately, the property has an unexpected maintenance issue. We apologize for the inconvenience."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking-123",
      "status": "declined",
      "declined_at": "2025-09-18T17:20:00Z"
    },
    "refund_processing": {
      "status": "initiated",
      "amount": 310800,
      "estimated_arrival": "2025-09-20T17:00:00Z"
    }
  }
}
```

### **GET /providers/analytics** 🔒
Provider performance analytics.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `period` (string): Time period (week, month, quarter, year)
- `start_date`, `end_date` (date): Custom date range

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue_analytics": {
      "current_period": {
        "total_revenue": 3800000,
        "booking_count": 18,
        "average_booking_value": 211111
      },
      "previous_period": {
        "total_revenue": 3200000,
        "booking_count": 16,
        "average_booking_value": 200000
      },
      "growth": {
        "revenue_growth": 18.75,
        "booking_growth": 12.5,
        "avg_value_growth": 5.56
      },
      "daily_breakdown": [
        {
          "date": "2025-09-01",
          "revenue": 185000,
          "bookings": 1
        }
      ]
    },
    "booking_analytics": {
      "occupancy_rate": 78,
      "booking_lead_time": 14, // average days in advance
      "cancellation_rate": 3.2,
      "repeat_guest_rate": 23,
      "seasonal_trends": [
        {
          "month": "December",
          "occupancy": 95,
          "average_rate": 125000
        }
      ]
    },
    "guest_analytics": {
      "average_rating": 4.8,
      "response_rate": 95,
      "response_time": 45, // minutes
      "guest_countries": [
        {
          "country": "France",
          "percentage": 35
        },
        {
          "country": "Germany",
          "percentage": 18
        }
      ]
    },
    "service_performance": [
      {
        "service_id": "service-123",
        "service_title": "Luxury Villa in Yaoundé",
        "revenue": 2100000,
        "bookings": 12,
        "occupancy_rate": 85,
        "average_rating": 4.9
      }
    ]
  }
}
```

This completes the comprehensive API documentation for the Ganitel platform. Let me update the todo list to mark this as complete and move to the next documentation phase.