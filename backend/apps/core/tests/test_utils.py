# apps/core/tests/test_utils.py
"""
TEST SUITE: Core App - Utilities
Test Suite ID: CORE-UTILS-001

This suite tests the core utility functions.
"""
from django.test import TestCase
from unittest.mock import patch, MagicMock, ANY
from django.core import mail
from apps.core.utils import send_placemate_email

class EmailUtilityTest(TestCase):
    """
    TEST SUITE: Email Utility Functions
    Test Suite ID: CORE-UTILS-001-001
    """
    
    @patch('apps.core.utils.render_to_string')
    @patch('apps.core.utils.send_mail')
    def test_send_placemate_email_success(self, mock_send_mail, mock_render_to_string):
        """
        Test Case ID: CORE-UTILS-001-001-001
        Module: Core App - send_placemate_email
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify email sending with template rendering works correctly
        Preconditions: Mock email backend configured
        
        Test Steps:
        1. Mock template rendering
        2. Call send_placemate_email with test parameters
        3. Verify send_mail is called with correct parameters
        
        Expected Results:
        - render_to_string is called with correct template and context
        - send_mail is called with correct subject, HTML content, and recipients
        - fail_silently is False to raise exceptions on failure
        """
        # Mock template rendering
        mock_render_to_string.return_value = '<html>Test Email Content</html>'
        
        test_context = {'user': 'Test User', 'action': 'registration'}
        test_recipients = ['test1@example.com', 'test2@example.com']
        
        send_placemate_email(
            subject='Test Email',
            template_name='emails/test.html',
            context=test_context,
            recipient_list=test_recipients
        )
        
        # Verify template rendering
        mock_render_to_string.assert_called_once_with('emails/test.html', test_context)
        
        # Verify email sending - use ANY for from_email since it comes from settings
        mock_send_mail.assert_called_once_with(
            subject='Test Email',
            message='',  # Empty plain text message
            from_email=ANY,  # Will use DEFAULT_FROM_EMAIL from settings
            recipient_list=test_recipients,
            html_message='<html>Test Email Content</html>',
            fail_silently=False  # Important: we want to know if email fails
        )
    
    @patch('apps.core.utils.render_to_string')
    @patch('apps.core.utils.send_mail')
    def test_send_placemate_email_failure_raises_exception(self, mock_send_mail, mock_render_to_string):
        """
        Test Case ID: CORE-UTILS-001-001-002
        Module: Core App - send_placemate_email
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify email failures raise exceptions (fail_silently=False)
        Preconditions: Email backend configured to fail
        
        Test Steps:
        1. Mock send_mail to raise exception
        2. Call send_placemate_email
        3. Verify exception is propagated
        
        Expected Results:
        - Exception from send_mail is not caught
        - fail_silently=False ensures we know about email failures
        """
        mock_render_to_string.return_value = '<html>Content</html>'
        mock_send_mail.side_effect = Exception('SMTP connection failed')
        
        with self.assertRaises(Exception) as context:
            send_placemate_email(
                subject='Test',
                template_name='test.html',
                context={},
                recipient_list=['test@example.com']
            )
        
        self.assertEqual(str(context.exception), 'SMTP connection failed')