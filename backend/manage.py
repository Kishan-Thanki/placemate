#!/usr/bin/env python
"""
Django's command-line utility for administrative tasks.

This script is the primary entry point for interacting with the Django project from the command line. 
It allows us to run management commands such as `runserver`, `migrate`, `makemigrations`, `test`, and `createsuperuser`.
"""
import os
import sys
from dotenv import load_dotenv


def main():
    """
    Sets up the environment and executes the requested Django management command.
    """
    # Load environment variables from the .env file.
    # This is a crucial first step that makes all the secrets and configurations in the .env file available to the application.
    load_dotenv()

    # Set a default environment variable that tells Django which settings
    # file to use. By pointing to 'placemate.settings.local', all `manage.py`
    # commands will run using the local development configuration by default.
    #
    # In a production environment, this variable is typically set and overridden
    # by the server or deployment script to point to `placemate.settings.production`.
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'placemate.settings.local')

    try:
        # Attempt to import Django's main command-line execution utility.
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # If Django cannot be imported, it's likely because it's not installed or the virtual environment is not activated. 
        # This provides a helpful error message to the user.
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Pass the command-line arguments (e.g., 'runserver') to Django to be executed.
    execute_from_command_line(sys.argv)


# This is a standard Python entry point. It ensures that the `main()` function
# is called only when this script is executed directly from the command line.
if __name__ == '__main__':
    main()