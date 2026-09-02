# PR-TERRA — Centralized Digital Examination Result Management System

## Current Phase
**PHASE 26 — AI Analytics**

## Technology Stack
- **Language**: Python 3.13+
- **Framework**: Django 5.2+
- **API Framework**: Django REST Framework (DRF)
- **Authentication**: DRF Simple JWT (`djangorestframework-simplejwt`)
- **Database**: PostgreSQL (with SQLite testing fallback)
- **Excel Engine**: OpenPyXL (`openpyxl`)
- **PDF & QR Engines**: ReportLab (`reportlab`), QR Code Generator (`qrcode[pil]`)
- **Middleware & Security**: `django-cors-headers`, `python-dotenv`, `psycopg` (binary driver)

---

## Phase 26 — AI Analytics (`/api/ai-analytics/`)
- Deterministic, rule-based AI Analytics Engine (`AIAnalyticsService` in `apps/reports/services/ai_analytics.py`).
- **No Duplicate Models**: Evaluated dynamically on-the-fly from `ResultCalculator` and database records. No machine learning training files or new database tables created.
- **Incomplete Tracking**: Missing component entries are tracked as `INCOMPLETE` and not treated as 0 or failed.
- **Decimal Precision**: Trend deltas and percentage comparisons use exact `Decimal` arithmetic.

### Features
1. **Student Performance Analysis**: Combines percentage, grade, status, strong subjects, weak subjects, trend, risk level, summary, and recommendations.
2. **Weak Subject Detection**: Identifies subjects where performance is comparatively low (< 50%, grade F/D, or FAIL status).
3. **Strong Subject Detection**: Identifies subjects with high performance (>= 75% or top grades A+/A).
4. **Performance Trend**: Compares current exam against historical exams to classify trend as `IMPROVING`, `DECLINING`, `STABLE`, or `INSUFFICIENT_DATA` with numerical change calculation.
5. **At-Risk Detection**: Classifies academic risk as `LOW`, `MEDIUM`, or `HIGH` with transparent, explanatory reasons.
6. **Personalized Recommendations**: Generates 2–5 actionable academic recommendations based on actual performance conditions.
7. **AI Summary**: Produces a concise, natural-language academic summary.
8. **Exam AI Analytics**: Exam-wide AI insights and risk breakdown (`GET /api/ai-analytics/exam/<exam_id>/`).

### Endpoints
- `GET /api/ai-analytics/student/<student_id>/?exam_id=1` — Student AI performance analysis (ADMIN=all, TEACHER=assigned section, STUDENT=own profile only).
- `GET /api/ai-analytics/exam/<exam_id>/` — Exam-level AI performance insights & risk breakdown (ADMIN & TEACHER).

---

## Phase 25 — Notifications (`/api/notifications/`)
- User-specific in-app database notification engine (`Notification` model).

---

## Phase 24 — Excel Import (`POST /api/marks/import/`)
- Allows authorized users (`ADMIN` & `TEACHER`) to upload student marks in `.xlsx` format.

---

## Phase 23 — Analytics (`/api/analytics/`)
- Dynamic, real-time academic analytics engine (`AnalyticsService`).

---

## Phase 21 — Audit Logs (`GET /api/audit-logs/`)
- Centralized, append-only audit logging engine (`AuditLog` model).

---

## Phase 20 — Correction Workflow (`/api/mark-corrections/`)
- Controlled mark correction request system with concurrency protection.

---

## Phase 19 — QR Verification (`GET /api/verify/result/{token}/`)
- Public QR code verification endpoint.

---

## Phase 18 — PDF Generation (`GET /api/results/{student_id}/{exam_id}/pdf/`)
- Official A4 examination result PDF generation.

---

## Setup & Testing Instructions

### 1. Activate Environment & Apply Migrations
```powershell
.venv\Scripts\Activate.ps1
python manage.py makemigrations
python manage.py migrate
```

### 2. Seed Demo Data
```powershell
python manage.py seed_roles
python manage.py seed_academics
python manage.py seed_teachers
python manage.py seed_subjects
python manage.py seed_assignments
python manage.py seed_exams
python manage.py seed_exam_subjects
python manage.py seed_exam_components
python manage.py seed_marks
```

### 3. Start Development Server
```powershell
python manage.py runserver
```
