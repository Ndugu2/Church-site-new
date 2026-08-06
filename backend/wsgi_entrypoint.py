"""
Vercel WSGI entrypoint for the Django backend.

Vercel's Python runtime requires this file to expose a WSGI `application`
callable. This simply re-exports the application from Django's wsgi module.
"""
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'church_backend.settings')

from church_backend.wsgi import application  # noqa: E402, F401
