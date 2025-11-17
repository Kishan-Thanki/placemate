from .base import *
import dj_database_url
from decouple import config

print("Loading local...")

# --- Core Settings ---
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "0.0.0.0" ,'host.docker.internal']

# --- Database ---
DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL", default="postgresql://user:pass@localhost/dbname"))
}

# --- CORS & Security ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

# Local cookie settings (HTTP, SameSite=Lax)
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"