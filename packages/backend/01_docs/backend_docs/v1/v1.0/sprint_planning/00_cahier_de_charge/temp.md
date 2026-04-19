Searched codebase for "Tranzak payment flow integration, payment, transaction, webhook, request create, collection, disbursement, payment request, auth token, payment models, booking payment, models for property/location/amenity/reviews/proximity", 14 results

Searched codebase for "Property, Location, Amenity, Review, Proximity, PropertyType models or entities or migrations", 21 results

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities/payment.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities/booking.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities/service_amenity.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/infrastructure/external_apis/tranzak_client.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/payments/initiate_payment.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/payments/process_webhook.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/payments.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/payments/process_refund.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities/negotiation.py)

Searched for regex `Proximity|minutes_away|travel_mode|destination_name` (`**/app/**`), no results

Scan done. Key existing pieces are in tranzak_client.py, initiate_payment.py, process_webhook.py, payments.py, payment.py, booking.py, service.py, service_amenity.py, review.py, and negotiation.py.

Gaps vs V1 needs
- Tranzak flow mismatches: missing token generation (`/auth/token`), missing `X-App-ID` header, payload/field names don’t match Tranzak (camelCase), response parsing expects `request_id` + `payment_url` (Tranzak returns `requestId` + `links.paymentAuthUrl`), verify endpoint path is wrong, refund endpoint doesn’t exist per docs, and webhook payload format/signature validation don’t match the Tranzak spec. Current flow is in tranzak_client.py and process_webhook.py.
- Data structures: no normalized `Locations`, `PropertyTypes`, `Properties` tables; service model uses loose `city/country` fields only. See service.py.
- Amenities: only `ServiceAmenity` exists (single table, no categories or join table). See service_amenity.py.
- Reviews: current `Review` is service‑based and lacks PO dimensions (`comfort`, `security`, `accessibility`, `host_response`) and property linkage. See review.py.
- Booking negotiation: `Negotiation` exists but booking status doesn’t include `NEGOTIATING`, and booking lacks `negotiated_price`. See booking.py and negotiation.py.
- Proximity entity is missing (no table/model).

V1 “what should be done” (sprint focus)
1) Fix Tranzak integration end‑to‑end  
   - Implement token flow + headers (`Authorization: Bearer {token}`, `X-App-ID`).  
   - Align create/verify/void/cancel endpoints + payload/response mapping.  
   - Store `requestId`, `paymentAuthUrl`, webhook `resource` data.  
   - Add webhook signature verification and correct status mapping.  
   - Update payment tests in test_payment_api.py.

2) Data model updates for PO requirements  
   - Add `Locations`, `PropertyTypes`, `Properties` + migrations.  
   - Add `AmenityCategories`, `Amenities`, `PropertyAmenities`.  
   - Add `Proximity`.  
   - Extend `Review` to include missing ratings; decide on property‑level vs service‑level reviews.

3) Booking negotiation alignment  
   - Add `NEGOTIATING` + `negotiated_price` to `Booking`.  
   - Wire negotiation flow to booking status transitions.

4) API/schema & seed data  
   - Update Pydantic schemas and endpoints to reflect new models.  
   - Seed `Locations`, `PropertyTypes`, amenities.  

If you want, I can draft the sprint backlog with ticket breakdown and estimated points next.