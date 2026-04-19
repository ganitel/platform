---

## 1. Core Property & Localization

To support the "Sélectionnez votre destination" and "Type de propriété" screens, we need normalized tables for locations and types.

### **Properties**

- `id` (UUID, PK)
- `title` (String): e.g., "Residence Life · Apartment"
- `description` (Text): "American styled duplex..."
- `property_type_id` (FK): Links to `PropertyTypes`
- `location_id` (FK): Links to `Locations`
- `price_per_period` (Decimal): e.g., 240
- `period_label` (String): e.g., "7 Nights"
- `max_guests` (Integer): 4
- `bedroom_count` (Integer): 2
- `bathroom_count` (Integer): 2
- `living_room_count` (Integer): 2
- `balcony_count` (Integer): 2
- `host_id` (FK): Links to `Users`
- `check_in_time` (Time): "12 PM"
- `check_out_time` (Time): "12 PM"

### **Locations & PropertyTypes**

- **Locations:** `id`, `name` (Douala, Yaoundé, Buea, Limbe, Kribi)
- **PropertyTypes:** `id`, `name` (Apartment, Duplex, Villa, Studio, Room)

---

## 2. Dynamic Amenity System

The designs show a tabbed interface (General, Living Room, Main Bedroom) with specific icons and labels. A flexible categorization approach is best here.

### **AmenityCategories**

- `id` (UUID, PK)
- `name` (String): e.g., "General", "Living Room", "Main Bedroom", "Kitchen", "Security"

### **Amenities**

- `id` (UUID, PK)
- `category_id` (FK)
- `name_en` (String): e.g., "Wi-Fi"
- `name_fr` (String): e.g., "Wifi"
- `icon_url` (String): Path to the specific icon asset

### **Property_Amenities** (Join Table)

- `property_id` (FK)
- `amenity_id` (FK)

---

## 3. User & Social Proof

The "Meet your host" and "Ratings and Reviews" sections require detailed tracking of user metrics and multi-dimensional feedback.

### **Users**

- `id` (UUID, PK)
- `full_name` (String): "M. Jacques Zeh"
- `avatar_url` (String)
- `bio` (Text)
- `deals_completed` (Integer): 234
- `total_bookings_formatted` (String): "+123k booked"

### **Reviews & Detailed Ratings**

- `id` (UUID, PK)
- `property_id` (FK)
- `user_id` (FK)
- `comment` (Text)
- `rating_comfort` (Float)
- `rating_security` (Float)
- `rating_cleanliness` (Float)
- `rating_accessibility` (Float)
- `rating_communication` (Float)
- `rating_value` (Float)
- `rating_host_response` (Float)
- `created_at` (Timestamp)

---

## 4. Booking & Proximity Logic

### **Bookings (Negotiation Logic)**

- `id` (UUID, PK)
- `property_id` (FK)
- `guest_id` (FK)
- `start_date` (Date): 23 July
- `end_date` (Date): 30 July
- `status` (Enum): `PENDING`, `NEGOTIATING`, `CONFIRMED`, `CANCELLED`
- `negotiated_price` (Decimal): Nullable until a deal is struck.

### **Proximity (Accessibility)**

- `id` (UUID, PK)
- `property_id` (FK)
- `destination_name` (String): "Airport", "Restaurant", "Gym"
- `minutes_away` (Integer): 10
- `travel_mode` (String): "drive"

---
