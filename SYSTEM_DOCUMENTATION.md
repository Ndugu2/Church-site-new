# Church Site System Documentation

## 1. Overview

Seattle International Church (Bugema University) is a full-stack platform with:
- A public-facing church website for students, members, and visitors.
- A restricted admin portal for staff operations.
- A Django REST API backend with token authentication and role/section authorization.

This document is the primary technical reference for architecture, operations, security, and deployment.

---

## 2. Current Architecture

## 2.1 High-Level Components

- Frontend: React + TypeScript + Vite
- Backend: Django + Django REST Framework
- Authentication: DRF TokenAuthentication (+ SessionAuthentication)
- Database (default): SQLite
- Database (production recommendation): PostgreSQL

## 2.2 Runtime Topology

```text
Browser (Public Site)  -->  frontend/index.html  -->  src/main.tsx  -->  src/PublicSiteApp.tsx
Browser (Admin Portal) -->  frontend/admin.html  -->  src/main.admin.tsx --> src/AdminPortalApp.tsx

Both frontend apps --> /api/* --> Django DRF backend --> database
```

## 2.3 Multi-Entry Build

Vite builds two HTML entries:
- `frontend/index.html` (public)
- `frontend/admin.html` (admin)

Configured in `frontend/vite.config.ts` under `build.rollupOptions.input`.

---

## 3. Frontend System

## 3.1 Entry Points (Now Fully Split)

Public entry chain:
- `frontend/index.html`
- `frontend/src/main.tsx`
- `frontend/src/PublicSiteApp.tsx`

Admin entry chain:
- `frontend/admin.html`
- `frontend/src/main.admin.tsx`
- `frontend/src/AdminPortalApp.tsx`

This gives separate bootstrap roots for public and admin UX while still sharing common libraries and styling.

## 3.2 Routing Behavior

- Public app defaults to `#/home` and supports public route whitelist.
- Admin app forces `#/admin` and displays admin login/portal flows.
- Visiting `#/admin` from public entry redirects to `admin.html#/admin`.

## 3.3 Frontend Configuration

Primary config files:
- `frontend/src/config.ts`
- `frontend/src/api.ts`
- `frontend/src/supabaseClient.ts`

Environment variable:
- `VITE_API_BASE_URL` (defaults to `/api`)

## 3.4 Styling and Hero Section

Main global stylesheet:
- `frontend/src/index.css`

Hero background is configured in `.hero-section` and can be updated by changing the CSS background image URL and overlay gradient.

---

## 4. Backend System

## 4.1 API Routing

Defined in:
- `backend/api/urls.py`

Custom endpoints:
- `POST /api/login/`
- `POST /api/register/`
- `GET /api/admin/session/`
- `GET|POST|PATCH /api/admin/users/`

Router resources include:
- sermons, events, prayers, bible-studies, donations
- projects, lessons, members, blog, testimonies
- forum-categories, forum-threads, forum-posts
- staff, admin-audit-logs, notifications, payments, analytics
- hymn-books, hymns, sabbath-programmes

## 4.2 Settings and Middleware

Key file:
- `backend/church_backend/settings.py`

Important controls:
- `DEBUG` from env (default true in local).
- `ALLOWED_HOSTS` from env.
- CORS allow-all in DEBUG; allow-list in non-DEBUG.
- Secure cookie and header hardening in non-DEBUG.
- Request logging middleware:
  - `api.middleware.RequestLoggingMiddleware`

## 4.3 Authentication Stack

DRF auth classes:
- `rest_framework.authentication.TokenAuthentication`
- `rest_framework.authentication.SessionAuthentication`

Default permission:
- `IsAuthenticatedOrReadOnly`

---

## 5. Authorization and Access Model

## 5.1 Admin Identity Levels

Access checks are based on:
- `is_staff`
- `is_superuser`
- group-derived department roles
- group-derived section access
- sabbath programme scope restrictions

## 5.2 Department Roles

Normalized department roles:
- `church_clerk`
- `sabbath_school`
- `evangelistic`

## 5.3 Section Access

Supported access sections include:
- `announcements`
- `bible_studies`
- `sabbath_programme`
- `prayers`
- `donations`
- `events`
- `sermons`
- `audit`
- `projects`
- `gallery`
- `lessons`
- `account_registration` (super-admin sensitive)

## 5.4 Admin Tab Gating

Backend login/session responses include:
- `admin_tabs`
- `department_roles`
- `sabbath_programme_scope`

Frontend uses this for tab visibility and capability gating.

---

## 6. Admin Account Lifecycle Management

Endpoint:
- `GET|POST|PATCH /api/admin/users/`

Restriction:
- Only authenticated super admin users can manage registration accounts.

Supported workflows:
- list staff accounts
- create staff account
- update profile and section access
- freeze/unfreeze (`is_active`)
- password reset (`new_password`)

Safety controls implemented:
- block non-superuser management attempts
- block self-freeze
- block freeze of final active superuser account
- require strong-enough password length on reset/create

---

## 7. Audit and Traceability

Audit model:
- `AdminAuditLog`

Audit records are written for:
- content write operations (create/update/delete where enabled)
- staff account lifecycle actions (`resource_type = StaffAccount`)

Stored metadata typically includes:
- actor
- action
- resource type/id/label
- before/after snapshots
- changed fields
- operation metadata (including password reset flag)

---

## 8. Data Model Domains

Core model domains in `backend/api/models.py`:
- Worship/content: Sermon, Event, BlogPost, LessonVideo, HymnBook, Hymn, SabbathProgramme
- Community: PrayerRequest, BibleStudy, Testimony, ForumCategory, ForumThread, ForumPost
- Operations: Donation, Project, ProjectUpdateLog
- Identity/staffing: MemberProfile, StaffMember
- Engagement/notifications: Notification, EventAttendance, PrayerSupport, PageView, EngagementMetric
- Payments: Payment
- Auditing: AdminAuditLog

---

## 9. API Reference (Concise)

## 9.1 Authentication

- `POST /api/register/`
- `POST /api/login/`
- `GET /api/admin/session/`

## 9.2 Admin Accounts

- `GET /api/admin/users/`
- `POST /api/admin/users/`
- `PATCH /api/admin/users/`

Example PATCH payload:

```json
{
  "id": 42,
  "full_name": "Jane Doe",
  "username": "jane_doe",
  "email": "jane@church.org",
  "access_sections": ["announcements", "bible_studies"],
  "sabbath_programme_scope": "full",
  "is_active": true,
  "new_password": "NewSecurePass123!"
}
```

## 9.3 Core Resources

- `/api/sermons/`
- `/api/events/`
- `/api/prayers/`
- `/api/bible-studies/`
- `/api/donations/`
- `/api/projects/`
- `/api/lessons/`
- `/api/blog/`
- `/api/testimonies/`
- `/api/forum-categories/`
- `/api/forum-threads/`
- `/api/forum-posts/`
- `/api/staff/`
- `/api/admin-audit-logs/`
- `/api/notifications/`
- `/api/payments/`
- `/api/analytics/`
- `/api/hymn-books/`
- `/api/hymns/`
- `/api/sabbath-programmes/`

---

## 10. Local Development Runbook

## 10.1 Backend

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend URLs:
- API root: `http://127.0.0.1:8000/api/`
- Django admin: `http://127.0.0.1:8000/admin/`

## 10.2 Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URLs:
- Public app: `http://localhost:5173/#/home`
- Admin app: `http://localhost:5173/admin.html#/admin`

## 10.3 Build Validation

```powershell
cd frontend
npm run build
```

---

## 11. Testing and Verification

## 11.1 Backend Tests

Run full backend test suite:

```powershell
cd backend
python manage.py test
```

Run admin-account focused tests:

```powershell
cd backend
python manage.py test api.tests.AdminAccountManagementTests
```

## 11.2 Manual Admin Validation

Recommended checks:
1. Log in as super admin.
2. Create a temporary staff account with section access.
3. Edit account permissions and scope.
4. Freeze and unfreeze the account.
5. Reset password and verify login behavior.
6. Confirm audit entries appear in `/api/admin-audit-logs/`.

---

## 12. Environment Variables

## 12.1 Backend

```env
SECRET_KEY=replace-in-production
DEBUG=False
ALLOWED_HOSTS=127.0.0.1,localhost,your-domain
CORS_ALLOWED_ORIGINS=https://your-frontend-domain
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-app-password
DJANGO_LOG_LEVEL=INFO
API_REQUEST_LOG_LEVEL=INFO
```

## 12.2 Frontend

```env
VITE_API_BASE_URL=/api
```

For split-domain deployment, set a full API origin, for example:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

---

## 13. Deployment Checklist

1. Set `DEBUG=False`.
2. Set strong `SECRET_KEY`.
3. Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
4. Move database to PostgreSQL.
5. Run migrations in target environment.
6. Rotate default and bootstrap credentials.
7. Serve Django with production WSGI/ASGI stack.
8. Enforce HTTPS and validate secure cookie behavior.
9. Verify admin account lifecycle safeguards in staging.
10. Verify audit log retention and monitoring.

---

## 14. Troubleshooting

## 14.1 Admin Portal Loads Public UI

- Confirm URL is `admin.html#/admin`.
- Confirm `frontend/admin.html` points to `src/main.admin.tsx`.

## 14.2 401 Errors in Admin

- Expected when not authenticated.
- Sign in with a staff account and check token storage.
- Verify `/api/admin/session/` response for current token.

## 14.3 API Not Reachable from Frontend

- Ensure backend server is running on expected host/port.
- Verify Vite proxy in `frontend/vite.config.ts`.
- Confirm `VITE_API_BASE_URL` is correct for environment.

## 14.4 Build Errors After Feature Work

- Run `npm run build` and resolve TypeScript errors first.
- If route/entry issues occur, verify both bootstraps and both app modules:
  - `src/main.tsx` -> `PublicSiteApp`
  - `src/main.admin.tsx` -> `AdminPortalApp`

---

## 15. Maintainer Notes

- Public and admin are now split at entry and app-module level.
- Shared CSS and shared service modules are intentionally reused.
- Keep security-sensitive logic on backend only; frontend tab gating is UX, not security.
