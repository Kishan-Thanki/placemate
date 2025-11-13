import cloudinary
from .base import *
import dj_database_url
from decouple import config

print("Loading production...")

# --- Production REST_FRAMEWORK Overrides ---
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'rest_framework.renderers.JSONRenderer',
)

# --- Core Settings ---
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = [
    ".onrender.com",
    "localhost",
    "127.0.0.1",
    "placemate-cvlb.onrender.com",
]

# --- Database ---
DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL"))
}

# --- CORS & Security ---
CORS_ALLOWED_ORIGINS = [
    "https://test-placemate-frontend.onrender.com",

    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "https://localhost:3000",     
    "https://127.0.0.1:3000",

    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",     
    "http://127.0.0.1:3000",

]
CSRF_TRUSTED_ORIGINS = [
    "https://test-placemate-frontend.onrender.com",
    "https://placemate-cvlb.onrender.com",

    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "https://localhost:3000",     
    "https://127.0.0.1:3000",

    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",     
    "http://127.0.0.1:3000",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[\w-]+-placemate-frontend\.onrender\.com$",
    r"^https://[\w-]+-placemate-[\w-]+\.onrender\.com$",
    r"^http://localhost:\d+$",  
    r"^http://192\.168\.\d+\.\d+:\d+$", 
]

# Strict CORS settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Production cookie settings (HTTPS, SameSite=None)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"  
SESSION_COOKIE_SAMESITE = "None"  
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- File Storage ---
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'