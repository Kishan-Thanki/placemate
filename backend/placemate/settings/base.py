"""
Base Django settings for the Placemate project.

This file contains the shared, non-secret configuration that is common to all environments (local, testing, production). 
Environment-specific settings are defined in `local.py` and `production.py` and import from this file.
"""
from pathlib import Path
from decouple import config
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# --- Core Paths ---
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# --- Security ---
# SECRET_KEY is loaded from the .env file and is crucial for security.
# It should never be hardcoded in the source code.
SECRET_KEY = config("SECRET_KEY")

# --- Application Definitions ---
# A list of all Django applications active in this project.
INSTALLED_APPS = [
    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-Party Apps
    'cloudinary_storage',
    'cloudinary',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_yasg',
    'health_check',
    'health_check.db',
    'django_rest_passwordreset',
    'anymail',

    # Custom Apps
    'apps.core.apps.CoreConfig',
    'apps.users.apps.UsersConfig',
    'apps.students.apps.StudentsConfig',
    'apps.companies.apps.CompaniesConfig',
    'apps.placements.apps.PlacementsConfig',
    'apps.jobs.apps.JobsConfig',
    'apps.applications.apps.ApplicationsConfig',
]

# --- Middleware Configuration ---
# Middleware processes requests and responses globally. The order is critical.
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  
    'apps.core.middleware.SecurityHeadersMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- URL and Template Configuration ---
ROOT_URLCONF = 'placemate.urls'
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
WSGI_APPLICATION = 'placemate.wsgi.application'
ASGI_APPLICATION = "placemate.asgi.application"

# --- Authentication ---
# Tells Django to use our custom User model for authentication.
AUTH_USER_MODEL = 'users.User'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internationalization ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- File Handling (Static & Media) ---
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]   
STATIC_ROOT = BASE_DIR / "staticfiles"     
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"            
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- API (Django REST Framework) ---
# Global settings for the entire API.
REST_FRAMEWORK = {
    # --- Custom Handlers ---
    'EXCEPTION_HANDLER': 'apps.core.exception_handler.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardPagination',
    
    # --- Renderer Configuration (Default) ---
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer', 
    ),

    # --- Security & Authentication ---
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.users.authentication.CookieJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  
    ),
    
    # --- API Features & Performance ---
    'PAGE_SIZE': 20, 
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day'
    },
}

# --- JWT (JSON Web Token) Configuration ---
# Controls the behavior of our authentication tokens.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# --- CORS (Cross-Origin Resource Sharing) ---
# Base settings for allowing frontend communication. 
# Specific origins are defined in local.py and production.py.
CORS_ALLOW_CREDENTIALS = True 
CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt',
    'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# --- Static Files ---
# WhiteNoise is used for efficient static file serving in production.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- Cloudinary (Media Files) ---
# Base configuration. Activated in production.py.
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY': config('CLOUDINARY_API_KEY', default=''),
    'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
    'secure': True,
}

# Default to local file storage for development. This will be overridden in production.
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# --- Email ---
# Default to printing emails to the console for development.
EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
ANYMAIL = {
    "BREVO_API_KEY": config("BREVO_API_KEY"),  # stored in Render env
}
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL') 
# --- Frontend Configuration ---
# The base URL for your frontend application. 
# This is used to construct absolute URLs in emails (e.g., for password reset links).
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')