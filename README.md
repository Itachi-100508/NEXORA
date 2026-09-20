# EXAMORA — Centralized Digital Examination Result Management System

## Overview
EXAMORA is a comprehensive full-stack digital examination result management system built with a Django REST Framework backend and a React (Vite) frontend.

---

## Production Vercel Deployment Guide

EXAMORA is fully configured for deployment on Vercel as a unified production application:
- **Frontend**: React + Vite (deployed via `@vercel/static-build`)
- **Backend**: Django REST Framework (deployed via Vercel `@vercel/python` serverless runtime)
- **Database**: PostgreSQL (Neon, Supabase, AWS RDS, or Render PostgreSQL)

---

### Architecture & Routing

When deployed to Vercel, the application routes are structured as follows:

| Path | Destination | Description |
| :--- | :--- | :--- |
| `/` | React App | SPA Frontend (React Router handles client routes) |
| `/api/*` | Django Backend | REST API endpoints |
| `/admin/*` | Django Admin | Django Admin Panel |
| `/static/*` | Django Static | Admin static assets served via WhiteNoise |

---

### Required Environment Variables in Vercel

Configure the following Environment Variables under **Project Settings -> Environment Variables** in Vercel:

| Environment Variable | Recommended Value / Format | Purpose |
| :--- | :--- | :--- |
| `SECRET_KEY` | `generate-a-strong-random-50-character-secret` | Django production signing key |
| `DEBUG` | `False` | Disables debug mode in production |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname?sslmode=require` | PostgreSQL database connection string |
| `DB_SSL_REQUIRE` | `True` | Forces SSL connection for PostgreSQL |
| `ALLOWED_HOSTS` | `.vercel.app,yourdomain.com` | Allowed host headers |
| `CORS_ALLOWED_ORIGINS` | `https://your-project.vercel.app` | Allowed CORS origins for frontend |
| `APP_BASE_URL` | `https://your-project.vercel.app` | Base URL used for generating QR verification links |

*(Note: Vercel automatically exposes `VERCEL_URL`, which EXAMORA reads as a default fallback for `ALLOWED_HOSTS` and QR code URLs).*

---

### Step-by-Step Vercel Deployment Instructions

#### Step 1: Push Repository to GitHub
Ensure all code and configurations (`vercel.json`, `requirements.txt`, `api/index.py`) are committed and pushed to your GitHub repository (`Itachi-100508/NEXORA`).

#### Step 2: Import Project in Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository `Itachi-100508/NEXORA`.
4. Framework Preset: **Other**.
5. Root Directory: `./` (leave default).

#### Step 3: Configure Environment Variables
Before deploying, expand the **Environment Variables** section in Vercel and add all required variables specified in the table above (especially `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`).

#### Step 4: Deploy
Click **Deploy**. Vercel will build the React frontend and bundle the Django Python serverless functions.

---

### Running Migrations & Creating Superuser on Production PostgreSQL

Since Vercel serverless functions are ephemeral and short-lived, Django database migrations and superuser creation must be run against your PostgreSQL database from a terminal session.

#### 1. Run Database Migrations
Run migrations against the production PostgreSQL instance by setting the `DATABASE_URL` environment variable locally:

```bash
# PowerShell (Windows)
$env:DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
python backend/manage.py migrate

# Bash / Zsh (Linux / macOS)
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
python backend/manage.py migrate
```

#### 2. Create Django Admin Superuser
```bash
python backend/manage.py createsuperuser
```

#### 3. (Optional) Seed Initial Academic & Exam Data
```bash
python backend/manage.py seed_roles
python backend/manage.py seed_academics
python backend/manage.py seed_teachers
python backend/manage.py seed_subjects
python backend/manage.py seed_assignments
python backend/manage.py seed_exams
python backend/manage.py seed_exam_subjects
python backend/manage.py seed_exam_components
python backend/manage.py seed_marks
```

---

### Testing the Production Build Locally

To test the frontend build and Django backend system check locally:

#### 1. Test React Frontend Build
```bash
cd frontend
npm run build
npm run preview
```

#### 2. Test Django Backend & System Check
```bash
cd backend
python manage.py check --deploy
```

#### 3. Test Serverless Handler Entrypoint
```bash
python -c "import sys; sys.path.append('.'); sys.path.append('backend'); import api.index as index; print(index.app)"
```
