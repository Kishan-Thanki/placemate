from .base import *

DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL"))
}

CORS_ALLOW_ALL_ORIGINS = True

# Local file storage for development
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Use local static and media files in development
STATIC_URL = "/static/"
MEDIA_URL = "/media/"