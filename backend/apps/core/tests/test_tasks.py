# apps/core/tests/test_tasks.py
"""
TEST SUITE: Core App - Background Tasks
Test Suite ID: CORE-TASKS-001

This suite tests the background task functionality for email sending.
"""
from django.test import TestCase
from unittest.mock import patch, MagicMock
from apps.core.tasks import send_email_in_background

class BackgroundTasksTest(TestCase):
    """
    TEST SUITE: Background Email Tasks
    Test Suite ID: CORE-TASKS-001-001
    """
    
    @patch('apps.core.tasks.threading.Thread')
    @patch('apps.core.tasks.send_placemate_email')
    def test_send_email_in_background(self, mock_send_email, mock_thread):
        """
        Test Case ID: CORE-TASKS-001-001-001
        Module: Core App - send_email_in_background
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify email is sent in background thread
        Preconditions: None
        
        Test Steps:
        1. Call send_email_in_background with test parameters
        2. Verify thread is created with correct target function
        3. Verify thread is started
        
        Expected Results:
        - Thread is created with send_placemate_email as target
        - Correct arguments are passed to the thread
        - Thread.start() is called to run in background
        - Function returns immediately without waiting for email
        """
        # Mock the thread instance
        mock_thread_instance = MagicMock()
        mock_thread.return_value = mock_thread_instance
        
        test_parameters = {
            'subject': 'Background Test Email',
            'template_name': 'emails/background_test.html',
            'context': {'user': 'Background User'},
            'recipient_list': ['background@example.com']
        }
        
        # Call the function
        send_email_in_background(**test_parameters)
        
        # Verify thread creation
        mock_thread.assert_called_once_with(
            target=mock_send_email,
            args=(
                'Background Test Email',
                'emails/background_test.html',
                {'user': 'Background User'},
                ['background@example.com']
            )
        )
        
        # Verify thread is started
        mock_thread_instance.start.assert_called_once()
    
    @patch('apps.core.tasks.threading.Thread')
    def test_background_email_immediate_return(self, mock_thread):
        """
        Test Case ID: CORE-TASKS-001-001-002
        Module: Core App - send_email_in_background
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify function returns immediately without blocking
        Preconditions: None
        
        Test Steps:
        1. Call send_email_in_background
        2. Verify function returns quickly (not waiting for email)
        3. Verify thread start is called but join is not
        
        Expected Results:
        - Function returns immediately
        - Thread is started but not joined
        - No waiting for email sending to complete
        """
        import time
        
        start_time = time.time()
        send_email_in_background(
            subject='Test',
            template_name='test.html', 
            context={},
            recipient_list=['test@example.com']
        )
        end_time = time.time()
        
        # Should return very quickly (not waiting for email)
        self.assertLess(end_time - start_time, 0.1)  # Less than 100ms
        
        # Thread should be started but not joined
        mock_thread.return_value.start.assert_called_once()
        mock_thread.return_value.join.assert_not_called()