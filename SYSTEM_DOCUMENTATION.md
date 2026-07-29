# Church Site System Documentation

## 1. Purpose and Scope

This document is the single source of truth for the Church Site platform.

It covers:
- System architecture (frontend, backend, data, auth)
- Access control and role model
- Admin account lifecycle management
- API surface and key endpoints
- Setup, operations, and testing
- Security controls and deployment checklist

The platform supports Seattle International Church at Bugema University with a public website, member workflows, and a restricted admin console.

---

## 2. High-Level Architecture

## 2.1 Runtime Components

- Frontend:
  - React + TypeScript + Vite
  - Public site entry and admin entry
- Backend:
  - Django + Django REST Framework (DRF)
  - Token-based API authentication
- Database:
  - SQLite (development default)
  - PostgreSQL-ready via dependencies/settings strategy

## 2.2 Workspace Structure

```text
Church Site/
  app.js, index.html, styles.css                # legacy prototype assets
  SYSTEM_DOCUMENTATION.md                        # this document
  README.md
  IMPLEMENTATION_GUIDE.md
  FEATURE_IMPLEMENTATION_SUMMARY.md
  TESTING_GUIDE.md

  backend/
    manage.py
    requirements.txt
    db.sqlite3
    church_backend/
      settings.py
      urls.py
    api/
      models.py
      serializers.py
      views.py
      urls.py
      tests.py
      migrations/

  frontend/
    admin.html                                   # admin entrypoint
    index.html                                   # public entrypoint
    package.json
    src/
      App.tsx
      index.css
      api.ts
      config.ts
      components/
```

## 2.3 Request Flow

1. Browser loads either public app or admin app.
2. Frontend calls backend API under /api.
3. Backend enforces permissions by auth status, staff/superuser flags, and section access rules.
4. Write actions are audit-logged for traceability.

---

## 3. Frontend Architecture

## 3.1 Entry Points

- Public: frontend/index.html
- Admin: frontend/admin.html

Admin hash route uses #/admin and loads admin interface from App.tsx state machine.

## 3.2 Frontend Configuration

File: frontend/src/config.ts

- API base URL is read from VITE_API_BASE_URL.
- Default fallback is /api.

```ts
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');
```

## 3.3 UI Domains in App.tsx

Main domains implemented in frontend/src/App.tsx:
- Public pages (home, worship, prayer, growth, community, etc.)
- Member auth modal and dashboard
- Admin login/session validation
- Admin tabs and CRUD workflows
- Registration Accounts (create/edit/freeze/password reset)

---

## 4. Backend Architecture

## 4.1 API Routing

File: backend/api/urls.py

Core custom endpoints:
- POST /api/login/
- POST /api/register/
- GET /api/admin/session/
- GET/POST/PATCH /api/admin/users/

DRF router resources include:
- sermons, events, prayers, bible-studies, donations
- projects, lessons, members, blog, testimonies
- forum-categories, forum-threads, forum-posts
- staff, admin-audit-logs, notifications, payments, analytics
- hymn-books, hymns, sabbath-programmes

## 4.2 Security and Middleware

File: backend/church_backend/settings.py

- DRF authentication classes:
  - TokenAuthentication
  - SessionAuthentication
- CORS:
  - allow all in DEBUG
  - allow-list mode in non-DEBUG via CORS_ALLOWED_ORIGINS
- Security flags in non-DEBUG:
  - secure cookies
  - XSS/content-type hardening
  - clickjacking protection
- Request logging middleware:
  - api.middleware.RequestLoggingMiddleware

---

## 5. Data Model Overview

Key model groups in backend/api/models.py:

- Worship and content:
  - Sermon, Event, BlogPost, LessonVideo, HymnBook, Hymn, SabbathProgramme
- Community and discipleship:
  - PrayerRequest, BibleStudy, Testimony, ForumCategory, ForumThread, ForumPost
- Church operations:
  - Donation, Project, ProjectUpdateLog
- Identity and staffing:
  - MemberProfile, StaffMember
- Engagement and notifications:
  - Notification, EventAttendance, PrayerSupport, PageView, EngagementMetric
- Payments:
  - Payment
- Auditing:
  - AdminAuditLog

---

## 6. Authentication and Authorization

## 6.1 Login and Session

- Login endpoint returns token plus role/access context.
- Admin frontend stores token and verifies session via /api/admin/session/.

## 6.2 Access Model

Admin capability is determined by:
- is_staff
- is_superuser
- Group-based section access
- Optional scope restrictions (for sabbath programme)

Group aliases and section mapping are resolved server-side in backend/api/views.py.

## 6.3 Department and Section Concepts

- Department-aligned roles:
  - church_clerk
  - sabbath_school
  - evangelistic
- Section rights (examples):
  - announcements, bible_studies, sabbath_programme
  - prayers, donations, events, sermons, audit, projects, gallery, lessons

These map to backend tab permissions and write authorization checks.

---

## 7. Registration Accounts Management (Admin)

Endpoint: /api/admin/users/

Only super admin can manage accounts.

Supported operations:

- GET:
  - List staff accounts
- POST:
  - Create staff account
  - Assign access_sections and optional sabbath_programme_scope
- PATCH:
  - Update profile fields (username, email, full_name)
  - Update access sections/scope
  - Freeze/unfreeze with is_active
  - Reset password with new_password

## 7.1 Safety Controls

Implemented backend protections:
- Non-superusers cannot call admin user management.
- A user cannot freeze their own account.
- The final active superuser account cannot be frozen.
- Password reset enforces minimum length (8).

## 7.2 UI Behavior

In Registration Accounts table (frontend/src/App.tsx):
- Row-level Edit mode with Save/Cancel
- Freeze/Unfreeze uses confirmation modal
- Change Password uses modal form with confirm password check

---

## 8. Audit Trail

Model: AdminAuditLog

Account lifecycle operations now emit StaffAccount audit records with:
- actor
- action (create/update)
- resource_type/resource_id/resource_label
- details JSON containing:
  - before snapshot
  - after snapshot
  - changed_fields map
  - metadata.operation
  - metadata.password_reset flag when applicable

This provides traceability for sensitive admin actions.

---

## 9. API Reference (Concise)

## 9.1 Auth

- POST /api/register/
- POST /api/login/
- GET /api/admin/session/

## 9.2 Admin Account Management

- GET /api/admin/users/
- POST /api/admin/users/
- PATCH /api/admin/users/

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

## 9.3 Core Content and Operations

- /api/sermons/
- /api/events/
- /api/prayers/
- /api/bible-studies/
- /api/donations/
- /api/projects/
- /api/lessons/
- /api/blog/
- /api/testimonies/
- /api/forum-categories/
- /api/forum-threads/
- /api/forum-posts/
- /api/staff/
- /api/admin-audit-logs/
- /api/notifications/
- /api/payments/
- /api/analytics/
- /api/hymn-books/
- /api/hymns/
- /api/sabbath-programmes/

---

## 10. Local Setup and Runbook

## 10.1 Backend

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 10.2 Frontend

```powershell
cd frontend
npm install
npm run dev
```

## 10.3 Optional Utility Scripts

- Windows quick start: start.bat
- Unix quick start: start.sh

Note: these scripts are convenience helpers. Validate path assumptions before production use.

---

## 11. Testing and Verification

## 11.1 Backend Focused Tests

Run account-management tests:

```powershell
cd backend
python manage.py test api.tests.AdminAccountManagementTests
```

Coverage includes:
- Super admin create/edit/freeze/password reset
- Non-superuser access rejection
- Last active superuser freeze protection
- Account audit metadata checks

## 11.2 Frontend Build Verification

```powershell
cd frontend
npm run build
```

Use successful build as baseline compile verification.

## 11.3 Live Functional Validation

Recommended manual flow in admin:
1. Create disposable staff account.
2. Edit account details and rights.
3. Freeze and unfreeze.
4. Reset password.
5. Validate login via /api/login/.

---

## 12. Environment Variables

## 12.1 Backend (typical)

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

For split-domain deployments, set VITE_API_BASE_URL to full API origin.

---

## 13. Deployment Checklist

1. Set DEBUG=False.
2. Set strong SECRET_KEY.
3. Configure ALLOWED_HOSTS and CORS allow-list.
4. Migrate to PostgreSQL for production workloads.
5. Run migrations on target environment.
6. Use secure credentials and rotate default admin secrets.
7. Serve backend via production server (for example gunicorn behind reverse proxy).
8. Enable HTTPS and verify secure cookie settings.
9. Validate admin account lifecycle safeguards in staging.
10. Confirm audit logs are being recorded and retained.

---

## 14. Operational Notes

- Request logs are available via api.request logger.
- Admin account actions are now auditable as StaffAccount resources.
- Public and admin UIs are integrated in one frontend codebase with separate entry pages.

---

## 15. Known Gaps and Recommendations

Current opportunities to improve:
- Add automated frontend tests for account modals and row edit flows.
- Add endpoint-level API documentation generation (OpenAPI/Swagger).
- Add explicit retention policy for AdminAuditLog records.
- Add production-grade secrets management and CI checks.

---

## 16. Document Ownership

- Primary technical owner: engineering/admin maintainers.
- Update this file whenever auth, permissions, API contracts, or operations workflow changes.
