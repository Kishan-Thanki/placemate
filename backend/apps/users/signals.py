"""
Signal Handlers for the Users App.

This module contains signal receivers that listen for specific events (signals) triggered within the Django project and perform actions accordingly. 
Using signals is a best practice that helps to decouple applications and keep logic clean.
"""
from django.conf import settings
from django.dispatch import receiver
from apps.core.utils import send_placemate_email 
from django_rest_passwordreset.signals import reset_password_token_created

# The @receiver decorator is the key component that connects this function to the signal.
# Whenever the `reset_password_token_created` signal is sent from anywhere in the application, 
# Django will automatically call this function.
@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    """
    Handles the `reset_password_token_created` signal from the password reset library.

    This function is triggered automatically whenever a user successfully requests a password reset. 
    Its primary job is to take the generated token, construct a full reset URL, and email it to the user using the project's centralized email utility.

    Args:
        sender (class): The class that sent the signal (provides context on the origin).
                        Not used here, but included as part of the standard pattern.
        instance: The model instance that was created, triggering the signal.
                  Not used here, but included as part of the standard pattern.
        reset_password_token: The token object that was created. It contains a
                              reference to the user and the unique token key.
        *args, **kwargs: Catches any other extra arguments the signal might send.
                         This is a best practice that makes the function robust
                         and compatible with future versions of the sending library.
    """
    # Build the full, dynamic reset URL. 
    # This combines the base URL of your frontend application (from settings.FRONTEND_URL) with the path to the
    # password reset page and the unique token.
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_password_token.key}/"

    # This 'context' dictionary contains the dynamic data that will be injected into the HTML email template. 
    # This allows for personalized emails.
    context = {
        'first_name': reset_password_token.user.get_full_name() or reset_password_token.user.email,
        'reset_url': reset_url 
    }

    # Call our reusable email function from the core app to send the email.
    # This keeps our code DRY and separates the logic of what to send from how to send it.
    send_placemate_email(
        subject="Password Reset for Your Placemate Account",
        template_name="emails/password_reset_email.html",
        context=context,
        recipient_list=[reset_password_token.user.email]
    )