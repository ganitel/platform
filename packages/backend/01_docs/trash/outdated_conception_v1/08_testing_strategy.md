

---

### ✅ Ganitel MVP – Testing Strategy

---

## 🎯 Objectives of Testing

* Ensure that the **core business logic** works as expected (bookings, availability, pricing, payments).
* Prevent regressions as you scale the API and add services (tours, dining, etc.).
* Keep a clear structure to onboard new contributors.
* Maintain confidence when shipping.

---

## 🧩 Types of Tests You’ll Use

| Type                | Scope                              | Tool/Framework          |
| ------------------- | ---------------------------------- | ----------------------- |
| ✅ Unit Tests        | Individual functions/services      | `pytest`, `unittest`    |
| ✅ Integration Tests | API calls hitting real services/db | `httpx`, `pytest`       |
| 🟡 End-to-End Tests | Full flow (user → booking → pay)   | `Playwright` (optional) |
| ✅ Manual Tests      | Basic flow validations             | Test script/checklist   |
| 🟡 Mocked API Tests | Webhooks (Tranzak, Twilio)         | `pytest + responses`    |

---

## 📁 Suggested Folder Structure

```bash
/backend
├── src/
│   └── ... # your code
├── tests/
│   ├── unit/
│   │   ├── test_booking_service.py
│   │   ├── test_price_calc.py
│   ├── integration/
│   │   ├── test_auth_routes.py
│   │   ├── test_booking_routes.py
│   ├── e2e/  (optional)
│   │   └── test_full_booking_flow.py
│   └── conftest.py  # pytest fixtures
```

---

## 🔧 Recommended Tools

* **pytest**: best for Python unit/integration testing
* **httpx + pytest-asyncio**: for testing FastAPI async endpoints
* **coverage**: see test coverage
* **factory\_boy or faker**: generate test data
* **Playwright / Selenium** (optional): for E2E web test automation
* **Postman / Insomnia**: for manual testing of REST API

---

## 🧪 What to test concretely?

### 🔹 Unit Tests

| Component            | What to test                             |
| -------------------- | ---------------------------------------- |
| Booking logic        | total price calculation, date validation |
| Availability service | check if date is blocked                 |
| User registration    | correct user creation from OTP flow      |
| Role restrictions    | permission logic (`user.role`)           |

---

### 🔹 Integration Tests

| Endpoint         | What to test                               |
| ---------------- | ------------------------------------------ |
| `POST /bookings` | creates booking, price ok, dates validated |
| `GET /listings`  | filters, pagination                        |
| `POST /payments` | payment record created, amount correct     |
| `POST /reviews`  | review linked to booking, rating saved     |
| `GET /auth/me`   | token-based auth working                   |

Use **real Supabase test instance**, or **SQLite test DB** (with FastAPI overrides).

---

### 🔹 Webhooks (mocked)

| Webhook                  | What to test                          |
| ------------------------ | ------------------------------------- |
| `POST /webhooks/tranzak` | valid signature, payment status saved |
| `POST /webhooks/twilio`  | WhatsApp message saved or handled     |

---

## ✅ Bonus: Manual Testing Checklist (MVP)

| Feature          | Manual Test Case                           |
| ---------------- | ------------------------------------------ |
| Auth OTP         | Can register and log in with valid number  |
| Booking          | Can book, can't double-book same date      |
| Payment          | Booking moves from `pending` → `confirmed` |
| Host dashboard   | Can create, edit, delete listing           |
| Admin moderation | Can approve listings                       |

You can manage this in **Notion**, **Google Sheets**, or even GitHub Projects.

---

## 📊 Code Coverage Target (Optional)

* 🎯 MVP goal: **\~80% coverage**
* Use `coverage run -m pytest && coverage report`

---

## 🧠 Conclusion – Next Steps

1. ✅ Setup `pytest`, `pytest-asyncio`, `httpx`
2. ✅ Create test DB connection (use Supabase test project or SQLite)
3. ✅ Add `conftest.py` for fixtures (user, listing, etc.)
4. 🧪 Write unit tests for `booking`, `availability`, `auth`
5. 🧪 Write integration tests for all key endpoints

---

