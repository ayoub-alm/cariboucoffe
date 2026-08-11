# Caribou Coffee Platform — Future Recommendations

> **Scope**: Full-stack scan of the Angular 17 frontend (`cariboucoffe`) and the FastAPI/PostgreSQL backend (`cariboucoffee_backend`).  
> **Date**: August 2026 · Generated after the schedule-scoring snapshot implementation.

---

## 🔴 Critical — Security & Stability

### 1. Lock Down CORS in Production
[main.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/main.py#L33) currently uses `allow_origins=["*"]`, which allows any website to make authenticated requests to the API.

**Recommendation**: Replace with an explicit allowlist loaded from the `.env` file:
```python
# .env
ALLOWED_ORIGINS=https://auditcariboucoffee.com,https://www.auditcariboucoffee.com

# main.py
app.add_middleware(CORSMiddleware, allow_origins=settings.BACKEND_CORS_ORIGINS, ...)
```

---

### 2. Rotate JWT Token & Add Refresh Token Flow
The JWT in [config.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/core/config.py) expires after **120 minutes**. There is no refresh token mechanism. If a token leaks it remains valid for 2 hours.

**Recommendations**:
- Reduce `ACCESS_TOKEN_EXPIRE_MINUTES` to `30`.
- Implement a `/auth/refresh` endpoint that issues a new short-lived access token using a long-lived, HTTP-only cookie refresh token.
- Store the refresh token in an HTTP-only cookie on the frontend instead of `localStorage`.

> [!CAUTION]
> Storing JWTs in `localStorage` is XSS-vulnerable. Migrate to HTTP-only cookies for production.

---

### 3. Rate Limiting on Auth Endpoints
The `/api/v1/login/access-token` endpoint has no rate limiting, making it susceptible to brute-force attacks.

**Recommendation**: Add `slowapi` or a reverse-proxy (nginx `limit_req`) rate limiter — e.g. 5 attempts / minute per IP.

---

### 4. Remove Seeded Test Data from Production Startup
[main.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/main.py#L109-L183) seeds **400 fake daily logs and 100 fake audits** at every startup if the DB is empty. These seed records do **not** populate the new `expected_opening/closing` snapshot columns, producing inconsistent scoring for those rows in production.

**Recommendation**: Move all seeding logic to a dedicated Alembic seed migration or a CLI command, and remove it from the startup event handler entirely.

---

### 5. Password Reset Flow Missing
There is no "Forgot password" flow. If a user forgets their credentials, an admin must manually reset via the API.

**Recommendation**: Implement a `/auth/request-reset` + `/auth/confirm-reset` email-based password reset flow using the existing `aiosmtplib` infrastructure.

---

## 🟠 Important — Performance & Scalability

### 6. `getAllLogs` Fetches 10 000 Records via Page Trick
In [daily-log.service.ts](file:///c:/Users/pcdev/ayoub/cariboucoffe/src/app/core/services/daily-log.service.ts#L82-L86), `getAllLogs()` requests `size=10000` — a paginated endpoint — to simulate a "fetch all" call. This is fragile and will fail silently when data exceeds 10 000 records.

**Recommendation**: Add a dedicated `/daily-logs/all` backend endpoint (or a `no_paginate=true` query param) that streams all matching rows without a page cap. Use it for calendar and chart views.

---

### 7. Server-Side Filtering is Double-Loaded
Every time [schedules.component.ts](file:///c:/Users/pcdev/ayoub/cariboucoffe/src/app/features/schedules/schedules.component.ts#L268-L299) loads, it makes **two** API calls: one paginated (for the table) and one full (for the charts). For large datasets this causes redundant DB queries.

**Recommendation**: Add KPI aggregates to the paginated response (already partially done) so charts can use the same payload, or implement a dedicated `/kpi/schedules` endpoint that returns pre-aggregated chart data.

---

### 8. Missing Database Indexes on Key Columns
`daily_time_records.date` and `daily_time_records.coffee_id` are heavily used in `WHERE` clauses but lack explicit indexes.

**Recommendation**: Add a composite index in a new migration:
```python
op.create_index("ix_daily_records_coffee_date", "daily_time_records", ["coffee_id", "date"])
```

---

### 9. Chart Rendering Blocks the Main Thread
All three Chart.js charts in `schedules.component.ts` render synchronously in `setTimeout(..., 100)`, which blocks UI responsiveness on large datasets.

**Recommendation**: Move chart data pre-processing to a Web Worker, or at minimum use `requestIdleCallback` to defer non-critical rendering.

---

## 🟡 Architecture & Code Quality

### 10. No Unit or Integration Tests
Neither the backend ([requirements.txt](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/requirements.txt) has no `pytest`) nor the frontend (only the default `app.spec.ts` bootstrapper exists) has any meaningful test coverage.

**Recommendation — Backend (priority)**:
```
pip install pytest pytest-asyncio httpx
```
Start with tests for `schedule_scoring.py` (pure functions, easy to test) and the `POST /daily-logs` snapshot logic.

**Recommendation — Frontend**:
Add Angular component tests for `ScheduleDialogComponent` (view/edit mode toggle) and service tests for `DailyLogService`.

---

### 11. Seed Data Bypasses `expected_opening/closing` Snapshot
Seeded `DailyTimeRecord` rows in [main.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/main.py#L151-L158) do not set `expected_opening`/`expected_closing`. These records will continue using the live-schedule fallback — undermining the snapshot immutability that was just implemented.

**Recommendation**: Update the seed loop to call `_resolve_expected_times()` for each generated record, or run a one-time backfill migration.

---

### 12. Notification Service Uses Hard-Coded Score Thresholds
In [notification.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/services/notification.py#L26-L45), `_score_color()` and `_score_label()` use hard-coded values (85, 70) that differ from the configurable `ConformityThreshold` table.

**Recommendation**: Load the threshold from the DB within the scheduler jobs to keep email reports consistent with the dashboard display.

---

### 13. `SchedulesComponent` is a Monolith (800+ lines)
[schedules.component.ts](file:///c:/Users/pcdev/ayoub/cariboucoffe/src/app/features/schedules/schedules.component.ts) handles table data, calendar, KPI calculation, three charts, filtering, pagination, dialog orchestration, and export — all in one file.

**Recommendation**: Extract into focused sub-components and services:
- `ScheduleTableComponent` (table + paginator)
- `ScheduleCalendarComponent` (calendar grid)
- `ScheduleChartsComponent` (all three Chart.js charts)
- `ScheduleKpiService` (KPI computation logic)

---

### 14. `on_event("startup")` is Deprecated in FastAPI
FastAPI deprecated `@app.on_event("startup")` in favour of `lifespan` context managers.

**Recommendation**:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup logic here
    yield
    # shutdown logic here

app = FastAPI(lifespan=lifespan)
```

---

### 15. `datetime.utcnow()` is Deprecated in Python 3.12+
[security.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/core/security.py#L13) uses `datetime.utcnow()` which is deprecated.

**Recommendation**:
```python
from datetime import datetime, timezone
expire = datetime.now(timezone.utc) + expires_delta
```

---

## 🟢 New Features & UX Improvements

### 16. Mobile PWA Support
The Angular app currently has no service worker / offline capability.

**Recommendation**: Add `@angular/pwa` and configure a service worker for offline-first access to the dashboard and schedule list. Controllers working in cafés with poor connectivity would benefit greatly.

---

### 17. Schedule History / Audit Trail for Daily Logs
When a controller updates an existing daily log (opening/closing times are changed), there is no history of what the previous values were.

**Recommendation**: Add a `daily_time_record_history` table that records the old values, the user who changed them, and the timestamp each time a record is updated. This is especially important now that snapshot times are frozen.

---

### 18. Bulk Import of Daily Logs (CSV/Excel Upload)
Currently, daily logs must be entered one-by-one. For controllers managing many cafés, this is tedious.

**Recommendation**: Add an "Import Excel" feature on the `/schedules` page where users can upload a spreadsheet with columns `[Date, Café, Opening, Closing]` and the backend parses, validates, and creates the records in batch.

---

### 19. Configurable Notification Recipients Per Café
The notification system sends reports to all users matching a flag (`receive_daily_report`, etc.) regardless of which cafés they manage.

**Recommendation**: Allow linking notification preferences to specific cafés so a manager of Caribou ANFA only receives reports about ANFA, not all shops.

---

### 20. Real-Time Alerts for Critical Schedule Violations
When a café opens 60+ minutes late, no real-time alert is sent. The violation only appears in the next scheduled report.

**Recommendation**: Add a webhook or push notification trigger when `create_daily_log` detects a `status="red"` result, alerting the assigned manager immediately via email or in-app notification.

---

### 21. Dark Mode Persistence
The theme selection from `ThemeService` is not persisted across sessions (e.g. in `localStorage`). Users must re-select their theme after every login.

**Recommendation**: Save the selected theme key to `localStorage` in `ThemeService` and restore it on app initialization.

---

### 22. Export PDF of Audit Reports
The backend has `fpdf2` in [requirements.txt](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/requirements.txt#L16) installed but it is not used anywhere.

**Recommendation**: Implement a `GET /audits/{id}/export-pdf` endpoint that generates a branded PDF report of a completed audit (questions, answers, score, photos). This is a common deliverable for operations teams.

---

### 23. Two-Factor Authentication (2FA)
For admin accounts managing sensitive KPI and user data, there is no 2FA.

**Recommendation**: Implement TOTP-based 2FA (e.g. using `pyotp`) for ADMIN and BOSS roles, with a QR code enrollment flow in the settings page.

---

## 📊 Observability & Operations

### 24. Structured JSON Logging
Current logging in [main.py](file:///c:/Users/pcdev/ayoub/cariboucoffee_backend/app/main.py#L18-L26) outputs plain text to `app.log` (already 24 MB). This is hard to search and parse.

**Recommendation**: Replace with `structlog` or `python-json-logger` for JSON-formatted logs, and set up log rotation with `RotatingFileHandler` to prevent unbounded log growth.

---

### 25. Health Check Endpoint
There is no `/health` endpoint for monitoring tools (UptimeRobot, Docker healthchecks, Kubernetes probes, etc.).

**Recommendation**:
```python
@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "reachable"}
```

---

### 26. API Versioning Strategy
All routes are under `/api/v1/` but there is no documented plan for what happens when breaking changes are needed.

**Recommendation**: Document a versioning policy (e.g. `/api/v2/` for breaking changes, deprecation notices in response headers) before the platform grows further.

---

## Summary Priority Table

| Priority | # | Area | Effort |
|---|---|---|---|
| 🔴 Critical | 1 | Lock CORS to production origins | Low |
| 🔴 Critical | 2 | Refresh token + HTTP-only cookie | Medium |
| 🔴 Critical | 3 | Rate limiting on login | Low |
| 🔴 Critical | 4 | Remove test seed from startup | Low |
| 🔴 Critical | 5 | Password reset flow | Medium |
| 🟠 Important | 6 | Dedicated `/all` logs endpoint | Low |
| 🟠 Important | 7 | Reduce double API calls in schedules | Medium |
| 🟠 Important | 8 | DB indexes on `coffee_id, date` | Low |
| 🟡 Quality | 10 | Add unit tests (backend + frontend) | High |
| 🟡 Quality | 11 | Backfill seed data snapshots | Low |
| 🟡 Quality | 13 | Split SchedulesComponent monolith | High |
| 🟡 Quality | 14 | Migrate to FastAPI `lifespan` | Low |
| 🟢 Feature | 16 | PWA / offline support | Medium |
| 🟢 Feature | 17 | Daily log edit history | Medium |
| 🟢 Feature | 18 | Bulk CSV/Excel import | Medium |
| 🟢 Feature | 22 | PDF export using fpdf2 | Medium |
| 📊 Ops | 24 | Structured JSON logging | Low |
| 📊 Ops | 25 | `/health` endpoint | Low |
