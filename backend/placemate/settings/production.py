import cloudinary
from .base import *
import cloudinary.api
import cloudinary.uploader
from decouple import config

# -------------------------
# Core Settings
# -------------------------
DEBUG = False
ALLOWED_HOSTS = [
    "placemate-zzgd.onrender.com",
    "placemate.onrender.com",
    "placemate.herokuapp.com"
]

# -------------------------
# Database
# -------------------------
DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL"))
}

# -------------------------
# CORS
# -------------------------
CORS_ALLOWED_ORIGINS = [
    "https://your-actual-frontend-domain.com",  
]

CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

# -------------------------
# Security
# -------------------------
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# -------------------------
# Cloudinary Configuration
# -------------------------
CLOUDINARY_CLOUD_NAME = config("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = config("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = config("CLOUDINARY_API_SECRET")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
    'API_KEY': CLOUDINARY_API_KEY,
    'API_SECRET': CLOUDINARY_API_SECRET,
    'static_folder': 'static',
    'media_folder': 'media',
    'static_file_mimetypes': {
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
    }
}

# -------------------------
# File Storage
# -------------------------
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
STATICFILES_STORAGE = 'cloudinary_storage.storage.StaticHashedCloudinaryStorage'

# -------------------------
# Static Files Configuration 
# -------------------------
STATIC_URL = f'https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/static/'
MEDIA_URL = f'https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/media/'

STATIC_ROOT = BASE_DIR / "static_collected"  
STATICFILES_DIRS = []  
MEDIA_ROOT = None     

# -------------------------
# Static Files Finder
# -------------------------
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# -------------------------
# Logging
# -------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}