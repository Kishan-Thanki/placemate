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

# --- Production REST_FRAMEWORK Overrides ---
# Disable the Browsable API in production for security.
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'rest_framework.renderers.JSONRenderer',
)

# --- Core Settings ---
# Disables detailed error pages for security.
DEBUG = config("DEBUG", default=False, cast=bool)

# A strict list of the allowed domain names for the live server.
ALLOWED_HOSTS = [
    ".onrender.com", 
    "localhost",
    "127.0.0.1",
    "https://placemate-three.vercel.app", 
    "https://placemate-coral.vercel.app"
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
    "https://localhost:5173",

    "http://127.0.0.1:5173",  
    "https://127.0.0.1:5173", 

    "http://localhost:3000",   
    "https://localhost:3000", 

    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",

    "http://localhost:5500",  
    "https://localhost:5500",  

    "http://127.0.0.1:5500", 
    "https://127.0.0.1:5500",  

    "https://placemate-three.vercel.app/",
    "https://placemate-coral.vercel.app/"
]

# Add these CORS settings:
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']

# A list of trusted origins for CSRF protection.
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "https://localhost:5173",

    "http://127.0.0.1:5173",  
    "https://127.0.0.1:5173", 

    "http://localhost:3000",   
    "https://localhost:3000", 

    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",

    "http://localhost:5500",  
    "https://localhost:5500",  

    "http://127.0.0.1:5500", 
    "https://127.0.0.1:5500", 
     
    "https://placemate-zzgd.onrender.com", 
    "https://placemate-three.vercel.app/",
    "https://placemate-coral.vercel.app/"
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

