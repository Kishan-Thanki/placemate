from django.dispatch import receiver
from apps.core.utils import send_placemate_email 
from django_rest_passwordreset.signals import reset_password_token_created

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    """
    Handles token creation when a user requests a password reset.
    Emails the user a link with the token.
    """
    context = {
        'first_name': reset_password_token.user.first_name,
        'token': reset_password_token.key
    }

    send_placemate_email(
        subject="Password Reset for Your Placemate Account",
        template_name="emails/password_reset_email.html",
        context=context,
        recipient_list=[reset_password_token.user.email]
    )