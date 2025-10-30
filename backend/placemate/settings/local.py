"""
Settings for the Local Development Environment.

This file imports the base settings and then overrides specific configurations for a fast and convenient local development experience.
"""
from .base import *
import dj_database_url
from decouple import config
import cloudinary

print("loading local...")

# --- Core Settings ---
# Enables detailed error pages for easy debugging.
DEBUG = True

# Allows requests from localhost and the local network.
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "0.0.0.0"]

# --- Database ---
# Connects to the local PostgreSQL database using the URL from the .env file.
DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL", default="postgresql://user:pass@localhost/dbname"))
}

# --- CORS ---
# A permissive CORS policy for local development, allowing any origin
# to make requests. This is convenient for running a local frontend.
#CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
# --- Security ---
# Disable HTTPS and secure cookie settings for local HTTP development.
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# --- Cloudinary Configuration for Local Development ---
# Enable Cloudinary for file uploads even in local development
cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME'),
    api_key=config('CLOUDINARY_API_KEY'),
    api_secret=config('CLOUDINARY_API_SECRET'),
    secure=True
)

# Use Cloudinary for media file storage (logos, etc.)
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'