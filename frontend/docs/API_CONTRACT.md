# EXAMORA API Contract & Service Specification

This document details the frontend API service architecture, HTTP endpoints, payloads, response schemas, error codes, and role-based access control requirements for the **EXAMORA Digital Result Management System**.

---

## 1. Architecture Overview

- **Base URL**: `https://api.examora.edu/v1` (configurable via `VITE_API_BASE_URL`)
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <token>`)
- **Content-Type**: `application/json` (or `multipart/form-data` for file uploads)
- **Error Format**: JSON response with standard status codes and `{ message: string, errors?: Record<string, string[]> }` payload.

### Standard Error Status Codes

| Status Code | Description | Frontend Handling |
|---|---|---|
| `400 Bad Request` | Invalid payload or parameter syntax | Displays field-level or form error |
| `401 Unauthorized` | Invalid, expired, or missing Bearer token | Clears token and redirects to `/login` |
| `403 Forbidden` | Authenticated user lacks required role | Redirects to `/403` Access Denied |
| `404 Not Found` | Requested entity does not exist | Renders NotFound error state |
| `409 Conflict` | Duplicate record or state mismatch | Displays conflict warning banner |
| `422 Unprocessable` | Semantic validation failed | Highlights invalid form inputs |
| `429 Too Many Requests` | Rate limit exceeded | Backoff and display retry notice |
| `500 Server Error` | Unhandled backend exception | Displays generic friendly error state |

---

## 2. API Endpoints by Service

### 2.1 Auth Service (`authService.js`)

#### `POST /auth/login`
- **Purpose**: Authenticate user credentials and retrieve session JWT.
- **Role**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@examora.edu",
    "password": "password"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "jwt-token-string",
    "user": {
      "id": "admin-001",
      "name": "Sarah Mitchell",
      "email": "admin@examora.edu",
      "role": "ADMIN",
      "roleLabel": "Administrator",
      "department": "Administration"
    }
  }
  ```

#### `POST /auth/forgot-password`
- **Purpose**: Send password reset email with secure token.
- **Role**: Public
- **Request Body**: `{ "email": "user@examora.edu" }`
- **Response `200 OK`**: `{ "message": "If this email exists, a reset link has been sent." }`

#### `GET /auth/me`
- **Purpose**: Validate existing session token and retrieve current user context.
- **Role**: Authenticated
- **Response `200 OK`**: `{ "user": { ... } }`

#### `POST /auth/logout`
- **Purpose**: Invalidate server session token.
- **Role**: Authenticated
- **Response `200 OK`**: `{ "message": "Logged out successfully." }`

---

### 2.2 Student Service (`studentService.js`)

#### `GET /students`
- **Purpose**: List student records with search and filter parameters.
- **Role**: `ADMIN`
- **Query Params**: `search`, `department`, `className`, `semester`, `page`, `pageSize`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": 21,
        "name": "Aisha Khan",
        "rollNumber": "CS-2023-001",
        "enrollmentNumber": "EN-2023-CS-0842",
        "email": "student@examora.edu",
        "department": "Computer Science",
        "className": "SE-I B",
        "semester": 3,
        "academicYear": "2025-2026",
        "status": "ACTIVE"
      }
    ],
    "total": 120
  }
  ```

#### `POST /students`
- **Purpose**: Create a new student enrollment record.
- **Role**: `ADMIN`
- **Request Body**: `{ name, rollNumber, enrollmentNumber, email, department, className, academicYear, semester }`

#### `PUT /students/:id`
- **Purpose**: Update an existing student's record.
- **Role**: `ADMIN`

#### `PATCH /students/:id/deactivate`
- **Purpose**: Deactivate a student record.
- **Role**: `ADMIN`

#### `GET /students/:id/results`
- **Purpose**: Retrieve historical results for a specific student.
- **Role**: `ADMIN`, `STUDENT` (own)

---

### 2.3 Teacher Service (`teacherService.js`)

#### `GET /teachers`
- **Purpose**: Retrieve teacher directory.
- **Role**: `ADMIN`
- **Response `200 OK`**: `{ "data": [{ "id": 1, "name": "James Carter", "employeeId": "EMP-1024", "department": "Computer Science", "status": "ACTIVE" }] }`

#### `POST /teachers` / `PUT /teachers/:id` / `PATCH /teachers/:id/deactivate`
- **Purpose**: Create, update, or deactivate teacher accounts.
- **Role**: `ADMIN`

---

### 2.4 Exam Service (`examService.js`)

#### `GET /exams`
- **Purpose**: List all scheduled examinations.
- **Role**: `ADMIN`, `TEACHER`
- **Query Params**: `search`, `status` (`UPCOMING` | `ACTIVE` | `CLOSED`)

#### `POST /exams` / `PUT /exams/:id`
- **Purpose**: Create or update examination schedule and details.
- **Role**: `ADMIN`

#### `PATCH /exams/:id/activate` / `PATCH /exams/:id/deactivate`
- **Purpose**: Toggle examination operational status.
- **Role**: `ADMIN`

---

### 2.5 Subject Service (`subjectService.js`)

#### `GET /subjects` / `POST /subjects` / `PUT /subjects/:id` / `PATCH /subjects/:id/deactivate`
- **Purpose**: Manage academic courses, credits, maximum marks, and passing thresholds.
- **Role**: `ADMIN`

---

### 2.6 Department Service (`departmentService.js`) & Class Service (`classService.js`)

#### `GET /departments`, `POST /departments`, `GET /classes`, `POST /classes`
- **Purpose**: Manage academic departments and class division batches.
- **Role**: `ADMIN`

---

### 2.7 Assignment Service (`assignmentService.js`)

#### `GET /assignments`
- **Purpose**: List exam-subject-class grading assignments.
- **Role**: `ADMIN`, `TEACHER` (assigned)
- **Query Params**: `status` (`DRAFT` | `PENDING` | `SUBMITTED` | `UNDER_REVIEW` | `APPROVED` | `REJECTED`)

#### `GET /assignments/:id/students`
- **Purpose**: Retrieve roster of enrolled students and draft/saved marks for an assignment.
- **Role**: `TEACHER` (assigned), `ADMIN`

---

### 2.8 Marks Service (`marksService.js`)

#### `POST /marks/:assignmentId/draft`
- **Purpose**: Save draft marks without submitting for formal review.
- **Role**: `TEACHER` (assigned)
- **Request Body**:
  ```json
  {
    "marks": {
      "21": { "internal": 28, "theory": 58, "practical": 0 }
    }
  }
  ```

#### `POST /marks/:assignmentId/submit`
- **Purpose**: Validate and submit all student marks for admin review. Locks editing.
- **Role**: `TEACHER` (assigned)

#### `POST /results/:id/review`
- **Purpose**: Admin approval or rejection of submitted marks.
- **Role**: `ADMIN`
- **Request Body**:
  ```json
  {
    "decision": "approve" | "reject",
    "note": "Rejection note or approval remarks"
  }
  ```

---

### 2.9 Result Service (`resultService.js`)

#### `GET /results/verification`
- **Purpose**: List pending submissions awaiting verification.
- **Role**: `ADMIN`

#### `GET /results/ready-to-publish`
- **Purpose**: List approved results ready for publication.
- **Role**: `ADMIN`

#### `POST /results/:id/publish`
- **Purpose**: Publish final result to student dashboards.
- **Role**: `ADMIN`

#### `GET /results` / `GET /results/:id`
- **Purpose**: Retrieve student published results and official statements.
- **Role**: `STUDENT` (own), `ADMIN`

---

### 2.10 Result Verification Service (`verificationService.js`)

#### `GET /results/verify`
- **Purpose**: Public verification of marksheet authenticity via Verification Code / QR.
- **Role**: Public
- **Query Params**: `code=EXAM-8F3A-2026`
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "verification": {
      "studentName": "Aisha Khan",
      "verificationId": "EXAM-8F3A-2026",
      "exam": "End Semester Examination",
      "semester": 3,
      "academicYear": "2025-2026",
      "status": "PASS",
      "verifiedAt": "2026-06-15T00:00:00.000Z"
    }
  }
  ```

---

### 2.11 Revaluation Service (`revaluationService.js`)

#### `GET /revaluations` / `GET /revaluations/my`
- **Purpose**: List student revaluation requests.
- **Role**: `ADMIN` (all), `STUDENT` (my requests)

#### `POST /revaluations`
- **Purpose**: Student submits a revaluation request for a specific subject within 7 days.
- **Role**: `STUDENT`
- **Request Body**: `{ resultId, subject, reason }`

#### `POST /revaluations/:id/decide`
- **Purpose**: Admin approves or rejects revaluation request with examiner remarks.
- **Role**: `ADMIN`

---

### 2.12 Report Service (`reportService.js`)

#### `GET /reports/performance` / `GET /reports/student-distribution`
- **Purpose**: Retrieve structured data for class, department, semester, and pass/fail reports.
- **Role**: `ADMIN`

#### `POST /reports/generate`
- **Purpose**: Generate on-demand report export (CSV/PDF/Excel).
- **Role**: `ADMIN`

---

### 2.13 Analytics Service (`analyticsService.js`)

#### `GET /analytics/overview`
- **Purpose**: Retrieve aggregated KPIs, pass/fail ratios, semester trends, and subject comparisons for charts.
- **Role**: `ADMIN`

---

### 2.14 Import Service (`importService.js`)

#### `POST /import/parse` *(PROPOSED API)*
- **Purpose**: Upload Excel/CSV file to validate rows and preview import errors.
- **Role**: `ADMIN`
- **Request**: `multipart/form-data` with `file`
- **Response `200 OK`**:
  ```json
  {
    "fileName": "students_batch_2026.xlsx",
    "rowsDetected": 60,
    "validRows": 57,
    "invalidRows": 3,
    "errors": [
      { "row": 24, "msg": "Marks exceed maximum threshold." },
      { "row": 31, "msg": "Student roll number CS-2023-099 not found." }
    ],
    "preview": [ ... ]
  }
  ```

#### `POST /import/:fileId/confirm` *(PROPOSED API)*
- **Purpose**: Commit valid previewed rows into the database.
- **Role**: `ADMIN`

---

### 2.15 AI Analytics Assistant Service (`aiService.js`) *(PROPOSED API)*

#### `POST /ai/assist`
- **Purpose**: Query institutional AI assistant for contextual summaries and trends. AI never computes official marks or grades.
- **Role**: Authenticated
- **Request Body**: `{ "question": "Which subject has the lowest pass rate?", "role": "ADMIN" }`
- **Response `200 OK`**: `{ "response": "Telecom batch TE-II A has the most failures this cycle (23%). Embedded Systems review recommended." }`

---

### 2.16 Notification Service (`notificationService.js`)

#### `GET /notifications` / `POST /notifications/:id/read` / `POST /notifications/read-all`
- **Purpose**: In-app notifications for mark submissions, approvals, revaluations, and exam announcements.
- **Role**: Authenticated
