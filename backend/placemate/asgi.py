"""
ASGI config for the Placemate project.

Asynchronous Server Gateway Interface (ASGI) is the modern standard for Python web servers and applications. 
This file serves as the main entry point for ASGI-compatible web servers (like Uvicorn or Daphne) to run the application.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see:
https://docs.djangoproject.com/en/stable/howto/deployment/asgi/
"""
import os
from django.core.asgi import get_asgi_application

# This line sets a default environment variable that tells Django which settings file to use when the application starts.
#
# For local development (when you run `python manage.py runserver`), this correctly points to your `local.py` settings.
#
# In a production environment like Render, 
# the server (e.g., Gunicorn/Uvicorn) will be configured to override this variable and point to the production
# settings file (`placemate.settings.production`) instead.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placemate.settings.local")

# This function loads the settings, sets up the Django application registry,
# and returns the main application object that the ASGI server will use to
# handle incoming requests.
application = get_asgi_application()