from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

def send_placemate_email(subject, template_name, context, recipient_list):
    """
    A utility function to send templated emails.
    """
    html_message = render_to_string(template_name, context)

    send_mail(
        subject=subject,
        message='',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )