"""
Application Configuration for the Users App.

This file defines the configuration class for the 'users' application.
It is used by Django's app-loading mechanism to manage application metadata
and to execute startup code, such as registering signal handlers.
"""
from django.apps import AppConfig

class UsersConfig(AppConfig):

    default_auto_field = 'django.db.models.BigAutoField'
    
    name = 'apps.users'

    def ready(self):
        """
        This method is called by Django when the application is ready.

        It's the standard place to import modules that need to run at startup, such as signal handlers. 
        Overriding this method is the correct way to connect your signals.
        """
        # Import the signals module. This line is what makes the signal receivers
        # (like the password reset email sender) connect to the signals they are listening for. 
        # Without this import, your signals will not work.
        import apps.users.signals