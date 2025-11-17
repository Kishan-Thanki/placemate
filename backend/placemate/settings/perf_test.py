from .base import *
import dj_database_url

print("=========================================")
print("PERFORMANCE TEST SETTINGS ACTIVATED")
print("Using local PostgreSQL database.")
print("=========================================")

# --- This is the new database URL from 'supabase start' ---
LOCAL_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Override the database to point to your safe local Postgres
DATABASES = {
    'default': dj_database_url.config(default=LOCAL_DB_URL, conn_max_age=600)
}

# Disable throttling for testing
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/minute',
    'user': '1000/minute'
}

# Use a simple secret key
SECRET_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'host.docker.internal']