## ✅ Point 3 — Non-Functional Requirements (MVP: Lodging)

This section outlines the **quality standards** and technical constraints that the platform must meet. These are critical for ensuring **performance, security, and reliability** in real-world use, especially in a mobile-first, low-cost MVP context.

---

### 🚀 A. Performance & Scalability

| Requirement          | Details                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Page/API speed**   | All page loads and API responses should occur in **< 3 seconds** under normal conditions.                                                              |
| **User load target** | Initial MVP should support up to **1,000 concurrent users** with a lean infrastructure.                                                                |
| **Scalability**      | Architecture will be **minimal** at first (e.g., Supabase, Vercel), but should allow easy vertical scaling. CDN usage (e.g. Cloudflare) is encouraged. |

---

### 🔒 B. Security & Data Protection

| Requirement            | Details                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Sensitive data**     | **Payment data** is the top priority. Other data (email, WhatsApp, booking history) should be protected too.       |
| **Encryption**         | All sensitive data should be **encrypted at rest and in transit**. Supabase provides built-in support.             |
| **Privacy regulation** | No GDPR compliance required at this stage, but data minimization will be applied (e.g., collect only when needed). |

---

### ☁️ C. Availability & Recovery

| Requirement         | Details                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Uptime goal**     | Target: **99% availability**, keeping in mind a lean infrastructure and cost minimization.                                     |
| **Backup strategy** | Use **Supabase’s automated daily backups**. Prepare a **manual export button** in the admin console.                           |
| **Recovery plan**   | A **simple disaster recovery plan** (e.g. Notion/Markdown doc) will be created to handle manual restoration in case of outage. |

---

### 📱 D. Accessibility & UX Optimizations

| Requirement            | Details                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Accessibility**      | No special accessibility features (e.g. screen reader, WCAG) planned in MVP.                                                          |
| **Mobile performance** | Design will be **mobile-first**, with optimizations for **low-end phones and slow internet** (e.g., image compression, lazy loading). |

---

### 📊 E. Observability & Analytics

| Requirement       | Details                                          |
| ----------------- | ------------------------------------------------ |
| **Admin console** | A basic internal dashboard will allow admins to: |

* View logs/errors
* Track reservations
* Manually resolve incidents |
  \| **Event tracking** | Key events will be **tracked for analysis**, including:
* Page views
* Searches
* Bookings
* Drop-off points
* Clicks on key UI elements |
  \| **Developer observability** | Errors will be logged (e.g., using Supabase functions, Vercel logs or Sentry). Alerts can be added later if needed. |


