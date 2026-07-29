# Testing Guide - Church Site Features

This guide will help you test all the implemented features.

## 🧪 Backend Testing

### 1. Test Server Running
```bash
cd backend
python manage.py runserver
```
Expected: Server starts on http://127.0.0.1:8000

### 2. Test Admin Panel
- Visit: http://127.0.0.1:8000/admin
- Login with superuser credentials
- Should see all new models in admin

### 3. Test API Endpoints

#### Registration & Login
```bash
# Register new user
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Login
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

#### Blog Posts
```bash
# Get all blog posts
curl http://127.0.0.1:8000/api/blog/

# Search blog posts
curl http://127.0.0.1:8000/api/blog/search/?q=test

# Get featured posts
curl http://127.0.0.1:8000/api/blog/featured/
```

#### Testimonies
```bash
# Get all testimonies
curl http://127.0.0.1:8000/api/testimonies/

# Get featured testimonies
curl http://127.0.0.1:8000/api/testimonies/featured/
```

#### Staff Directory
```bash
# Get all staff
curl http://127.0.0.1:8000/api/staff/

# Get by department
curl http://127.0.0.1:8000/api/staff/by_department/?department=Pastoral
```

#### Forums
```bash
# Get forum categories
curl http://127.0.0.1:8000/api/forum-categories/

# Get forum threads
curl http://127.0.0.1:8000/api/forum-threads/

# Get forum threads by category
curl http://127.0.0.1:8000/api/forum-threads/?category_id=1
```

#### Other Resources
```bash
# Get sermons
curl http://127.0.0.1:8000/api/sermons/

# Get events
curl http://127.0.0.1:8000/api/events/

# Get prayers
curl http://127.0.0.1:8000/api/prayers/

# Get notifications (requires auth)
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/notifications/
```

---

## 🎨 Frontend Testing

### 1. Test Frontend Server
```bash
cd frontend
npm run dev
```
Expected: Server starts on http://localhost:5173

### 2. Test Navigation
- ✓ Home page loads
- ✓ Admin portal loads at http://localhost:5173/admin.html#/admin
- ✓ All new menu items appear:
  - Blog, Testimonies, Forums, Staff, etc.
- ✓ Language switcher visible in header
- ✓ Login/Register buttons visible

### 3. Test Authentication
1. Click "Register" button
   - Fill form with new credentials
   - Click "Create Account"
   - Should show success message

2. Click "Login" button
   - Enter credentials
   - Click "Login"
   - Should show user menu with Dashboard/Logout

3. Click "Logout"
   - Should return to home
   - Auth buttons should reappear

### 4. Test New Pages

#### Blog Page
- Click "Blog" in navigation
- Should see list of blog posts
- Test search functionality
- Test category filter
- Click "Read More" on a post

#### Testimonies Page
- Click "Testimonies" in navigation
- Should see featured testimonies
- Should see all testimonies list
- Cards should show author info

#### Staff Directory
- Click "Staff" in navigation
- Should see staff cards with photos
- Test department filter
- Contact info should be visible

#### Forums Page
- Click "Forums" in navigation
- Should see forum categories
- Click a category to see threads
- Should show thread details

#### Member Dashboard (Authenticated)
- Click "Dashboard" (after login)
- Should show member statistics
- Cards should display role, tithe, attendance
- Tabs should switch between sections

#### Payment Form
- In "Give" section
- Should show amount input
- Should show donation type dropdown
- Should show payment method dropdown
- Click "Give Now" button

#### Analytics Dashboard (Admin)
- Login as superuser
- Click "Analytics" in navigation
- Should show key metrics
- Should display member count, donations, etc.

### 5. Test Language Switcher
- Click language dropdown in header
- Select different language
- Page text should attempt to translate
- Selection should persist on reload

---

## 📊 Database Testing

### 1. Check Migrations Applied
```bash
cd backend
python manage.py showmigrations api
```
Expected: All migrations should show as [X] (applied)

### 2. Test Django Admin
1. Login to http://127.0.0.1:8000/admin
2. Verify all new models appear:
   - Member Profiles
   - Blog Posts
   - Testimonies
   - Forum Categories/Threads/Posts
   - Staff Members
   - Notifications
   - Payments
   - etc.

3. Create test data:
   - Add a blog post
   - Add a staff member
   - Add a forum category
   - Create a testimony
   - Create a payment record

### 3. Check Database
```bash
cd backend
python manage.py dbshell
.tables  # List all tables
SELECT COUNT(*) FROM api_blogpost;  # Count records
```

---

## 🔔 Email/Notification Testing

### 1. Configure Email in Settings
```python
# backend/church_backend/settings.py
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
```

### 2. Test Notification Command
```bash
cd backend
python manage.py send_notifications
```
Expected: Should send reminders for tomorrow's events

### 3. Schedule Notifications
- **Windows Task Scheduler**:
  1. Open Task Scheduler
  2. Create Basic Task
  3. Set trigger: Daily at desired time
  4. Set action: Run python manage.py send_notifications

- **Linux Cron**:
  ```bash
  0 10 * * * cd /path/to/backend && python manage.py send_notifications
  ```

---

## 🧩 Component Integration Testing

### 1. Login Flow
1. Open app
2. Click Register
3. Create account
4. Logout
5. Click Login
6. Login with new credentials
7. Should show Dashboard option

### 2. Blog Workflow
1. Create blog post in admin
2. View on Blog page
3. Search should find it
4. Filter by category should work
5. View count should increment on click

### 3. Forum Workflow
1. Create forum category in admin
2. Create thread in admin
3. View on Forums page
4. Click category to see thread
5. Should display thread info

### 4. Payment Workflow
1. Navigate to "Give" page
2. Fill in amount
3. Select donation type
4. Select payment method
5. Click "Give Now"
6. Check admin for payment record

---

## 🚨 Troubleshooting

### Backend Issues

**Error: "ModuleNotFoundError: No module named 'django'"**
- Solution: Install requirements: `pip install -r requirements.txt`

**Error: "AlreadyRegistered"**
- Solution: Likely duplicate admin registration - check admin.py for duplicates

**Error: Migration failures**
- Solution: Run `python manage.py migrate --fake-initial` to reset

### Frontend Issues

**Components not appearing**
- Check that components are imported in App.tsx
- Check browser console for errors
- Verify API URL is correct in components

**API calls failing**
- Verify backend is running on port 8000
- Check CORS settings in settings.py
- Check network tab in browser DevTools

**Styling issues**
- Check that CSS is importing correctly
- Clear browser cache
- Run `npm install` to ensure dependencies

---

## ✅ Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Admin panel accessible and functional
- [ ] All models visible in admin
- [ ] User registration works
- [ ] User login works
- [ ] Blog page displays posts
- [ ] Testimonies page works
- [ ] Staff directory displays correctly
- [ ] Forums page shows categories
- [ ] Member dashboard shows after login
- [ ] Payment form accessible
- [ ] Language switcher works
- [ ] Logout functionality works
- [ ] All API endpoints respond
- [ ] Database contains test data

---

## 🎯 Expected Results

When all features are working correctly:

1. **Backend** (http://127.0.0.1:8000):
   - REST API returns JSON responses
   - Admin panel fully functional
   - All models registered
   - Email configuration working

2. **Frontend** (http://localhost:5173):
   - All pages load without errors
   - Components render correctly
   - Forms submit successfully
   - Navigation works smoothly
   - Authentication flow complete

3. **Database**:
   - All tables created
   - Test data accessible
   - Relationships functional

---

## 📞 Support

For issues:
1. Check the error messages in console/terminal
2. Refer to Django/React documentation
3. Check CORS and firewall settings
4. Verify database is accessible
5. Check email configuration if notifications fail

Happy testing! 🎉
