import threading
from .utils import send_placemate_email

def send_email_in_background(subject, template_name, context, recipient_list):
    """
    Sends an email in a separate background thread.
    This makes the API response return immediately without waiting for the email to be sent.
    
    USAGE:
    ------
    # In views or serializers, call this instead of send_placemate_email directly
    send_email_in_background(
        subject="Welcome to Placemate!",
        template_name="emails/welcome.html", 
        context={'user': user, 'password': temp_password},
        recipient_list=[user.email]
    )
    
    PARAMETERS:
    ----------
    :param subject: Email subject line
    :param template_name: Path to email template (e.g., 'emails/welcome.html')
    :param context: Dictionary of variables to render in template
    :param recipient_list: List of email addresses to receive the email
    """
    # Create a new thread that will run the send_placemate_email function
    email_thread = threading.Thread(
        target=send_placemate_email,
        args=(subject, template_name, context, recipient_list)
    )
    # Start the thread. This returns immediately.
    email_thread.start()