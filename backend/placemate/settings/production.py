"""
Settings for the Production Environment.

This file imports the base settings and then overrides them with configurations that are optimized for a live, deployed server. 
It prioritizes security, performance, and scalability.
"""
import cloudinary
from .base import *
import dj_database_url
from decouple import config

print("loading production...")

# --- Core Settings ---
# Disables detailed error pages for security.
DEBUG = False

# A strict list of the allowed domain names for the live server.
ALLOWED_HOSTS = [
    ".onrender.com", 
    "localhost",
    "127.0.0.1",
    "final-production-domain.com", 
]

# --- Database ---
# Connects to the production Supabase database using the URL from environment variables.
DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL"))
}

# --- CORS & Security ---
# A strict list of the frontend domains that are allowed to make API requests.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
    "http://localhost:3000",  
    "http://127.0.0.1:3000", 
    "https://final-frontend-domain.com", 
    "https://www.final-frontend-domain.com",
]

# A list of trusted origins for CSRF protection.
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",  
    "http://127.0.0.1:3000", 
    "http://localhost:5173",  
    "http://127.0.0.1:5173",  
    "https://placemate-zzgd.onrender.com", 
    "https://final-frontend-domain.com",  
]

# --- Production Security Headers ---
# Enforce secure cookies and HTTPS.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- File Storage ---
# This line OVERRIDES the base setting and activates Cloudinary for all
# user-uploaded media files in the production environment.
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# --- Email ---
# Overrides the base setting to use a real SMTP service (Gmail) for sending emails in production.
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')