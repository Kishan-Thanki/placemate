from .base import *

print("=========================================")
print("TEST SETTINGS ACTIVATED")
print("=========================================")

# Override settings for testing
DEBUG = False
TESTING = True

# FORCE SQLite for testing (override any other database settings)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        }
    }
}

# Remove any database routers that might interfere
DATABASE_ROUTERS = []

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Mock external services
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable throttling in tests
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/minute',
    'user': '1000/minute'
}

# Test-specific security key
SECRET_KEY = 'django-insecure-+l-sj(*p+y%gt(r5hk24_8eh_yud))91@5rh_+mlr*govzrgfj'

print("Test configuration loaded successfully!")