"""
Core Utilities for the Placemate Project.

This module contains shared, reusable utility functions that can be used by any app across the project. 
Centralizing utilities like email sending ensures consistency and follows the DRY (Don't Repeat Yourself) principle.
"""
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

def send_placemate_email(subject, template_name, context, recipient_list):
    """
    Renders an HTML template with a given context and sends it as an email.

    This is the primary, centralized email-sending function for the entire application. 
    It dynamically uses the email backend configured in the active settings file.

    Args:
        subject (str): The subject line of the email.
        template_name (str): The path to the email template, relative to the 'templates' directory
        context (dict): A dictionary of data to be rendered into the template.
        recipient_list (list): A list of recipient email addresses.

    Raises:
        Exception: Will raise an exception (e.g., SMTPServerDisconnected) if the
                   email backend fails to send the email, because `fail_silently` is set to False.
    """
    # Renders the specified HTML template with the provided context data,
    # turning it into a string that can be used as the email body.
    html_message = render_to_string(template_name, context)

    # Uses Django's built-in mail function to send the email.
    send_mail(
        subject=subject,
        message='',  
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False, 
    )