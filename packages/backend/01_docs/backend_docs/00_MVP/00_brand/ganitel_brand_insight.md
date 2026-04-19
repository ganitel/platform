Project Overview
ganitel’s core mission is to partner with local service providers in the
hospitality, leisure, and tourism industries to create curated travel
experiences. We leverage technology to repackage these offerings,
enabling travelers to conveniently book multiple services as a single
package or reserve individual services with ease. This end-to-end
journey, from booking to enjoyment, is what we define as “the ganitel
Experience.
”
Target Audience
Primary: Diaspora travelers returning to their home countries for
vacations.
Secondary: Middle and upper-class professionals taking leave for
rejuvenation.
Tertiary: Any traveler seeking to explore leisure and tourism
experiences.
Strategic Vision This project is strategically planned to expand its
coverage to all of Africa in the years to come, becoming the definitive
platform for African tourism.
ganitel Brand insight and technicalities
Services Available on Ganitel
This section outlines the initial service categories to be available on
the ganitel platform, with notes on future scalability.
1. Accommodation Bookings
Core Functionality: Enable travelers to search for, view, and book
vacation rentals.
Future-Proofing Note: The system's data model should be
designed to handle different property types, initially focusing on
guesthouses but with the scalability to easily integrate hotels and
other accommodation types in the future.
2. Vehicle Rentals
Core Functionality: Facilitate the booking of vacation car rentals.
Future-Proofing Note: The system must initially support bookings
that include a driver. The backend should be architected to allow
for the future addition of a self-drive option, which will require a
separate module for client verification and security protocols.
3. Restaurant & Dining Services
Core Functionality: Provide tools for travelers to order meals for
delivery/pickup and to make reservations for in-restaurant dining.
Note: This represents two distinct but related features that will
require separate user flows and data structures.
4. Guided Tours & Activities
Core Functionality: Allow travelers to book tours of historic
places, cultural sites, and institutions, with certified tour guides.
5. Flight Bookings
Core Functionality: Enable the booking of flights to various
vacation destinations.
Note: This will likely require integration with third-party Global
Distribution System (GDS) APIs or similar booking engines.
6. Wellness & Spa Sessions
Core Functionality: Provide a booking engine for spa sessions and
other relaxation-focused services.
User Scenarios & Booking Flows
The platform is designed to serve three distinct traveler types, each
with a unique booking behavior. The backend architecture must be
flexible enough to support all three scenarios seamlessly, prioritizing
user convenience in every flow.
1. The Curated-Trip Planner
This user takes a hands-on approach, building a complete, custom
itinerary from the ground up. They browse services and destinations,
adding each individual accommodation, activity, or transport option
to a dynamic trip cart.
Technical Implication: The system requires a robust shopping cart
model capable of holding multiple, disparate services. The
checkout process must consolidate all services into a single
transaction, with clear visibility of all costs and bookings.
2. The Package Customizer
This user prefers the convenience of a pre-designed itinerary. They
select a pre-packaged experience, which is curated based on popular
data. However, they require the flexibility to modify this package to
better suit their needs.
Technical Implication: The platform must present pre-bundled
packages as a core feature. The booking engine must support a
"configure" or "customize" function, allowing users to add or
subtract specific services from the package before completing
their booking.
3. The Single-Service Booker
This user books services on an individual, a la carte basis. They may
only require a single stay, a one-off restaurant reservation, or a
specific tour. They do not need the complexity of a multi-service
itinerary.
Technical Implication: The user interface and booking flow must
prioritize a fast, straightforward checkout for single-service
bookings. This simple transaction model must be a core and easily
accessible path for all users.
User Roles & Permissions
This section defines the three primary user roles and their specific
permissions. This is critical for establishing the backend's security
and access control rules.
1. Traveller (Authenticated User)
Can:
Create and manage their personal profile (e.g., name,
contact info).
View all public listings for Services and Packages.
Search and filter listings based on criteria (e.g., location,
date, price).
Add items to a booking cart.
Proceed to checkout and make secure payments.
View a history of all their past and upcoming Bookings.
View details of a specific booking.
Communicate with a Service Provider regarding a
confirmed booking.
Cancel a booking according to the cancellation policy.
Leave a review and rating for a Service or Service Provider
after a booking is complete.
2. Service Provider (Authenticated User)
Can:
Create and manage their business profile.
Create, edit, and publish new Service and Package listings.
Set pricing, availability, and policies for each listing.
View incoming booking requests and manage their status
(e.g., accept, decline).
Communicate with a Traveller about a confirmed booking.
Manage payments and view financial reports on their
earnings.
3. Administrator (Internal ganitel User)
Can:
Manage all Traveller and Service Provider accounts.
Approve or deactivate Service Provider profiles and their
listings.
Manage and resolve booking disputes.
Access and analyze platform analytics and reports.
Manage and update platform-wide content (e.g., prepackaged experiences, promotional banners).
Functional Requirements
This section breaks down the platform's features into specific,
actionable requirements.
1 User Management
The system shall allow users to register with an email or
WhatsApp and get one-time access codes. service providers
will be required to create passwords.
The system shall provide a secure login/logout process.
The system shall support "Forgot Password" functionality.
The system shall allow users to create and edit a profile.
2 Search & Discovery
The system shall provide a search bar for keywords.
The system shall provide filtering options by location, date
range, price, and category.
The system shall display search results with a clear visual
representation of each listing.
The system shall allow users to save favorite listings for later
reference.
3 Booking & Transactions
The system shall allow travelers to add multiple Services to a
single booking cart.
The system shall support booking of pre-packaged Packages.
The system shall allow modification of a Package before
checkout.
The system shall integrate with a secure payment gateway
(e.g., Stripe, Flutterwave) to process payments.
The system shall send automated email confirmations to both
the Traveller and the Service Provider upon successful
booking.
The system shall support a clear cancellation and refund
process based on defined policies.
4 Provider Management
The system shall provide a dashboard for Service Providers to
manage all their listings.
The system shall allow providers to upload photos, videos, and
detailed descriptions for each listing.
The system shall provide a calendar view for managing
availability and blocking out dates.
The system shall provide an overview of all upcoming and past
bookings.
5 Communication & Community
The system shall include a private messaging feature for
communication between a Traveller and a Service Provider
after a booking is confirmed.
The system shall support a review and rating system for all
booked Services and Providers.
The system shall display average ratings and reviews on each
listing page.
Non-Functional Requirements
This section defines the quality attributes of the system that are
essential for long-term success.
Scalability: The platform must be architected to handle a 10x
increase in users and transactions within the first 3 years. The
database must be able to scale without requiring a complete
redesign.
Performance: All API endpoints must respond within 500ms
under normal load. Page load times should not exceed 3
seconds.
Security: All sensitive data, including user credentials and
payment information, must be encrypted at rest and in transit
(e.g., using SSL/TLS). The platform must comply with relevant
data protection regulations.
Reliability: The system must maintain an uptime of at least
99.9%. A disaster recovery and backup plan must be
implemented.
Usability: The user interface should be intuitive and require
minimal training for all user roles. The design must be
responsive and optimized for mobile devices.
Conceptual Data Model
This section describes how the core data entities are related. This
is the blueprint for the database structure.
Traveller entity: Has a one-to-many relationship with the
Booking entity. (A traveller can have many bookings).
Service Provider entity: Has a one-to-many relationship with
both the Service and Package entities. (A provider can list
many services and packages).
Service entity: Can have a one-to-one relationship with a
Booking or a many-to-many relationship with a Package. (A
service can be booked individually or be part of many
different packages).
Package entity: Has a one-to-many relationship with a Booking
and a many-to-many relationship with the Service entity. (A
package can be booked many times and can contain many
services).
Booking entity: Has a one-to-one relationship with a
Transaction and a one-to-one relationship with a Review.