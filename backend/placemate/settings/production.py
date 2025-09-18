from .base import *

DEBUG = False
ALLOWED_HOSTS = ["placemate.onrender.com", "placemate.herokuapp.com"]

CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True