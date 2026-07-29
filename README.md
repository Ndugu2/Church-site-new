# Seattle International Church — Full-Stack Website
### Bugema University, Uganda

> *Growing in Christ • Serving the World • Sharing Hope*

A modern, full-stack web application for **Seattle International Church** at Bugema University — a Seventh-day Adventist congregation serving a diverse international student and faculty community.

---

## Documentation Index

For complete architecture, API, operations, and testing details, use:

- `SYSTEM_DOCUMENTATION.md` (primary technical reference)
- `TESTING_GUIDE.md` (manual testing workflows)
- `IMPLEMENTATION_GUIDE.md` (feature implementation history)
- `FEATURE_IMPLEMENTATION_SUMMARY.md` (high-level implemented features)
- `COMPLETION_VERIFIED.md` (completion verification notes)

---

## 🏗️ Project Architecture

```
Church Site/
├── frontend/                  # React + TypeScript (Vite)
│   ├── src/
│   │   ├── PublicSiteApp.tsx  # Public app root module
│   │   ├── AdminPortalApp.tsx # Admin app root module
│   │   ├── main.tsx           # Public bootstrap entry
│   │   ├── main.admin.tsx     # Admin bootstrap entry
│   │   └── index.css          # Design system (Deep Blue & Gold palette)
│   ├── index.html             # Public entry point
│   └── admin.html             # Admin entry point
│
├── backend/                   # Python Django REST Framework API
│   ├── church_backend/        # Django project settings, root URLs
│   ├── api/
│   │   ├── models.py          # Database models
│   │   ├── serializers.py     # DRF JSON serializers
│   │   ├── views.py           # REST ViewSets (CRUD)
│   │   ├── urls.py            # API URL router
│   │   └── admin.py           # Django admin registration
│   ├── seed.py                # Initial data seeding script
│   ├── create_superuser.py    # Admin user setup script
│   ├── requirements.txt       # Python dependencies
│   └── db.sqlite3             # SQLite database (auto-created)
│
├── venv/                      # Python virtual environment
├── index.html                 # Standalone HTML/CSS/JS prototype
├── styles.css                 # Prototype stylesheet
└── app.js                     # Prototype JavaScript engine
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+ and npm
- Python 3.11+

---

### 1. Clone / Open Project

```powershell
cd "c:\Users\ADMIN\Desktop\Church Site"
```

---

### 2. Set Up Python Backend

```powershell
# Activate the virtual environment
.\venv\Scripts\activate

# Install dependencies (already done — for fresh environments)
pip install -r backend\requirements.txt

# Run database migrations
python backend\manage.py migrate

# Seed initial sermons and events
cd backend
python seed.py

# Create admin superuser (one-time)
python create_superuser.py

# Start the Django REST server
python manage.py runserver
```

✅ Django API is now available at **http://127.0.0.1:8000/api/**
✅ Django Admin panel is available at **http://127.0.0.1:8000/admin/**

---

### 3. Set Up React Frontend

Open a new terminal:

```powershell
cd "c:\Users\ADMIN\Desktop\Church Site\frontend"
npm install
npm run dev
```

✅ The React app is now available at **http://localhost:5173/**

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/sermons/` | List or create sermons |
| GET/PUT/DELETE | `/api/sermons/{id}/` | Retrieve, update, or delete a sermon |
| GET/POST | `/api/events/` | List or create events |
| GET/PUT/DELETE | `/api/events/{id}/` | Retrieve, update, or delete an event |
| GET/POST | `/api/prayers/` | List or submit prayer requests |
| GET/DELETE | `/api/prayers/{id}/` | View or delete a prayer request |
| GET/POST | `/api/bible-studies/` | List or register for Bible study |
| GET/DELETE | `/api/bible-studies/{id}/` | View or delete a registration |
| GET/POST | `/api/donations/` | List or log a donation |

---

## 🌐 Website Pages

| Route | Description |
|-------|-------------|
| Home | Hero banner, pastor welcome, service times, student hub |
| About | Church history, mission, beliefs, leadership |
| Ministries | Ministry cards with detail modal |
| Sermons | Filtered archive synced from Django API |
| Events | Upcoming events with registration modal |
| Gallery | Filterable photo albums |
| Watch Live | YouTube embed + live fellowship chat |
| Bible Study | Registration form → saved to Django DB |
| Prayer Requests | Anonymous-friendly prayer submission form |
| Give | Tithe & Offering portal (Mobile Money, Bank, PayPal) |
| Contact | Message form + campus location |
| Admin Portal | Stats dashboard, manage submissions, add events/sermons |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#1E3A8A` (Deep Blue) |
| Accent | `#D4AF37` (Gold) |
| Success | `#2E7D32` (Green) |
| Background | `#F8FAFC` (Light Slate) |
| Heading Font | Cinzel + Outfit |
| Body Font | Inter |

---

## 🔐 Django Admin Credentials

```
URL:      http://127.0.0.1:8000/admin/
Username: admin
Password: sic_admin_2026
```

> ⚠️ **Change the password before deploying to production.**

---

## 🚀 Production Deployment

| Component | Recommended Service |
|-----------|-------------------|
| Frontend (React) | **Vercel** — connect `./frontend` directory |
| Backend (Django) | **Railway** or **Render** — connect `./backend` directory |
| Database | **PostgreSQL** on Railway/Render (update `settings.py` `DATABASES`) |
| Media/Images | **Cloudinary** |
| Sermons/Live | **YouTube** embed |

### Environment Variables for Production

```env
# backend/.env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

---

## 📖 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Vanilla CSS (custom design system) |
| Backend Framework | Django 5.2 |
| REST API | Django REST Framework 3.17 |
| CORS | django-cors-headers |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL |

---

## 🎵 Bridge Hymnal (638) CSV Import

If you have the full Bridge Hymnal source list (CSV or JSON), you can generate a normalized CSV for this project:

```powershell
cd "c:\Users\ADMIN\Desktop\Church Site"
python tools\build_bridge_hymnal_csv.py --input your_bridge_hymns_file.csv --output bridge_hymnal_songs.csv --expected-count 638
```

Template you can fill:
- `bridge_hymnal_import_template.csv`

Expected output:
- `bridge_hymnal_songs.csv`

If the script reports a count lower than 638, the input file is incomplete or has rows missing a hymn number/title.

---

*© 2026 Seattle International Church, Bugema University. All rights reserved.*
 
