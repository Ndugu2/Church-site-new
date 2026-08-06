"""
Run this script once to create the admin superuser for the Django admin panel.

Usage:
    cd backend
    python create_superuser.py

Then visit: http://127.0.0.1:8000/admin/
Username: admin
Password: sic_admin_2026
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'church_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

ADMIN_USERNAME = 'admin'
ADMIN_EMAIL = 'admin@sic.bugema.ac.ug'
ADMIN_PASSWORD = 'sic_admin_2026'

if not User.objects.filter(username=ADMIN_USERNAME).exists():
    user = User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD
    )
    Token.objects.get_or_create(user=user)
    print("Superuser created successfully!")
    print(f"   Username: {ADMIN_USERNAME}")
    print(f"   Password: {ADMIN_PASSWORD}")
    print(f"   Admin URL: http://127.0.0.1:8000/admin/")
else:
    user = User.objects.get(username=ADMIN_USERNAME)
    user.email = ADMIN_EMAIL
    user.is_staff = True
    user.is_superuser = True
    user.set_password(ADMIN_PASSWORD)
    user.save(update_fields=['email', 'is_staff', 'is_superuser', 'password'])
    Token.objects.get_or_create(user=user)
    print(f"Superuser '{ADMIN_USERNAME}' already exists; credentials were refreshed.")
    print(f"   Username: {ADMIN_USERNAME}")
    print(f"   Password: {ADMIN_PASSWORD}")
    print(f"   Admin URL: http://127.0.0.1:8000/admin/")
