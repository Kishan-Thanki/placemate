"""
WSGI config for the Placemate project.

Web Server Gateway Interface (WSGI) is the standard for Python web applications that run in a synchronous manner. 
This file serves as the main entry point for WSGI-compatible web servers (like Gunicorn) to run the application.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see:
https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# This line sets a default environment variable that tells Django which settings file to use when the application starts.
#
# For local development (when you run `python manage.py runserver`), this correctly points to your `local.py` settings.
#
# In a production environment like Render, the server (e.g., Gunicorn)
# will be configured to override this variable and point to the production settings file (`placemate.settings.production`) instead. 
# This allows the same `wsgi.py` file to work seamlessly in both environments.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placemate.settings.local")

# This function loads the settings, sets up the Django application registry,
# and returns the main application object that the WSGI server will use to
# handle incoming HTTP requests.
application = get_wsgi_application()