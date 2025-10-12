"""
Signal Handlers for the Users App.

This module contains signal receivers that listen for specific events (signals) triggered within the Django project and perform actions accordingly. 
Using signals is a best practice that helps to decouple applications and keep logic clean.

SIGNAL HANDLERS:
===============
- password_reset_token_created: Sends password reset emails via background task

BACKGROUND PROCESSING:
=====================
All email sending is delegated to background tasks to:
- Prevent blocking API responses
- Improve user experience with faster response times
- Handle email delivery failures gracefully without affecting core functionality
"""

from django.conf import settings
from django.dispatch import receiver
from apps.core.tasks import send_email_in_background 
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

    PERFORMANCE IMPROVEMENT:
    -----------------------
    Uses send_email_in_background() instead of send_placemate_email() to:
    - Return immediately without waiting for email delivery
    - Prevent password reset requests from being blocked by email service latency
    - Maintain responsive user experience during high email volume

    SECURITY NOTES:
    --------------
    - Password reset tokens are short-lived (typically 1-24 hours)
    - Reset URLs contain secure tokens that are hard to guess
    - Email is sent asynchronously but token creation is synchronous for security

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
    reset_url = f"{settings.FRONTEND_URL}/auth/reset/{reset_password_token.key}/"

    # This 'context' dictionary contains the dynamic data that will be injected into the HTML email template. 
    # This allows for personalized emails.
    context = {
        'first_name': reset_password_token.user.get_full_name() or reset_password_token.user.email,
        'reset_url': reset_url 
    }

    # Use background task for email sending instead of direct call
    # This returns immediately, allowing the password reset request to complete quickly
    # while the email is sent in a separate thread
    send_email_in_background(
        subject="Password Reset for Your Placemate Account",
        template_name="emails/password_reset_email.html",
        context=context,
        recipient_list=[reset_password_token.user.email]
    )