"""
TEST SUITE: Placements App - Utils
Test Suite ID: PLACEMENTS-UTILS-001

Tests for placement utility functions, particularly send_drive_notification.
"""
from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.utils import timezone
from datetime import datetime
from apps.placements.utils import send_drive_notification
from apps.placements.models import CompanyDrive, PlacementDrive
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from django.contrib.auth import get_user_model

User = get_user_model()


def create_verified_student(user, program, enrollment_number, joining_year, **overrides):
    profile_data = {
        'program': program,
        'enrollment_number': enrollment_number,
        'joining_year': joining_year,
        'current_cgpa': 8.5,
        'tenth_percentage': 85.0,
        'twelfth_percentage': 80.0,
        'active_backlogs': 0,
        'is_placed': False,
        'is_verified': True,
    }
    profile_data.update(overrides)
    return StudentProfile.objects.create(user=user, **profile_data)


class SendDriveNotificationTest(TestCase):
    """
    TEST SUITE: send_drive_notification
    Test Suite ID: PLACEMENTS-UTILS-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        # Create degree and programs
        self.degree = Degree.objects.create(
            name='Bachelor of Science',
            abbreviation='B.Sc'
        )
        
        # Program with 4-year duration (final year = current year - 3)
        self.program_4yr = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG',
            duration_years=4,
            degree=self.degree
        )
        
        # Program with 2-year duration (final year = current year - 1)
        self.program_2yr = Program.objects.create(
            name='Master of Science',
            abbreviation='M.Sc',
            degree_level='PG',
            duration_years=2,
            degree=self.degree
        )
        
        # Create students
        current_year = datetime.now().year
        
        # Final year student for 4-year program (joining_year = current_year - 3)
        self.final_year_student = User.objects.create_user(
            email='finalyear@example.com',
            phone_number='1111111111',
            first_name='Final',
            last_name='Year',
            password='pass123'
        )
        self.final_year_profile = create_verified_student(
            user=self.final_year_student,
            program=self.program_4yr,
            enrollment_number='EN2021001',
            joining_year=current_year - 3
        )
        
        # Not final year student (joining_year = current_year - 2)
        self.not_final_student = User.objects.create_user(
            email='notfinal@example.com',
            phone_number='2222222222',
            first_name='Not',
            last_name='Final',
            password='pass123'
        )
        self.not_final_profile = create_verified_student(
            user=self.not_final_student,
            program=self.program_4yr,
            enrollment_number='EN2022001',
            joining_year=current_year - 2
        )
        
        # Placed student (should not receive notification)
        self.placed_student = User.objects.create_user(
            email='placed@example.com',
            phone_number='3333333333',
            first_name='Placed',
            last_name='Student',
            password='pass123'
        )
        self.placed_profile = create_verified_student(
            user=self.placed_student,
            program=self.program_4yr,
            enrollment_number='EN2021002',
            joining_year=current_year - 3,
            is_placed=True  # Already placed
        )
        
        # Inactive user (should not receive notification)
        self.inactive_student = User.objects.create_user(
            email='inactive@example.com',
            phone_number='4444444444',
            first_name='Inactive',
            last_name='User',
            password='pass123',
            is_active=False  # Inactive
        )
        self.inactive_profile = create_verified_student(
            user=self.inactive_student,
            program=self.program_4yr,
            enrollment_number='EN2021003',
            joining_year=current_year - 3
        )
    
    @patch('apps.placements.utils.send_email_in_background')
    def test_send_drive_notification_final_year_students(self, mock_send_email):
        """
        Test Case ID: PLACEMENTS-UTILS-001-001-001
        Module: Placements App - send_drive_notification
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify notifications sent only to final year students
        """
        program_ids = [self.program_4yr.id]
        job_titles = ['Software Engineer']
        deadline = timezone.now() + timezone.timedelta(days=7)
        
        send_drive_notification('Test Company', deadline, program_ids, job_titles)
        
        # Should send email only to final year student (not placed, active)
        self.assertEqual(mock_send_email.call_count, 1)
        
        # Verify email was sent to correct student
        call_args = mock_send_email.call_args
        # call_args is (args, kwargs) tuple, so use [1] for kwargs
        recipient_list = call_args[1].get('recipient_list', [])
        self.assertEqual(recipient_list, ['finalyear@example.com'])
    
    @patch('apps.placements.utils.send_email_in_background')
    def test_send_drive_notification_excludes_placed_students(self, mock_send_email):
        """
        Test Case ID: PLACEMENTS-UTILS-001-001-002
        Module: Placements App - send_drive_notification
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify placed students don't receive notifications
        """
        program_ids = [self.program_4yr.id]
        job_titles = ['Software Engineer']
        deadline = timezone.now() + timezone.timedelta(days=7)
        
        send_drive_notification('Test Company', deadline, program_ids, job_titles)
        
        # Verify placed student email not in call list
        all_recipients = []
        for call in mock_send_email.call_args_list:
            # call is (args, kwargs) tuple
            recipient_list = call[1].get('recipient_list', [])
            if recipient_list:
                all_recipients.extend(recipient_list)
        self.assertNotIn('placed@example.com', all_recipients)
    
    @patch('apps.placements.utils.send_email_in_background')
    def test_send_drive_notification_excludes_inactive_users(self, mock_send_email):
        """
        Test Case ID: PLACEMENTS-UTILS-001-001-003
        Module: Placements App - send_drive_notification
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify inactive users don't receive notifications
        """
        program_ids = [self.program_4yr.id]
        job_titles = ['Software Engineer']
        deadline = timezone.now() + timezone.timedelta(days=7)
        
        send_drive_notification('Test Company', deadline, program_ids, job_titles)
        
        # Verify inactive user email not in call list
        all_recipients = []
        for call in mock_send_email.call_args_list:
            # call is (args, kwargs) tuple
            recipient_list = call[1].get('recipient_list', [])
            if recipient_list:
                all_recipients.extend(recipient_list)
        self.assertNotIn('inactive@example.com', all_recipients)
    
    @patch('apps.placements.utils.send_email_in_background')
    def test_send_drive_notification_multiple_programs(self, mock_send_email):
        """
        Test Case ID: PLACEMENTS-UTILS-001-001-004
        Module: Placements App - send_drive_notification
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify notifications sent for multiple programs
        """
        # Create final year student for 2-year program
        current_year = datetime.now().year
        pg_final_student = User.objects.create_user(
            email='pgfinal@example.com',
            phone_number='5555555555',
            first_name='PG',
            last_name='Final',
            password='pass123'
        )
        pg_final_profile = create_verified_student(
            user=pg_final_student,
            program=self.program_2yr,
            enrollment_number='EN2023001',
            joining_year=current_year - 1
        )
        
        program_ids = [self.program_4yr.id, self.program_2yr.id]
        job_titles = ['Software Engineer', 'Data Scientist']
        deadline = timezone.now() + timezone.timedelta(days=7)
        
        send_drive_notification('Test Company', deadline, program_ids, job_titles)
        
        # Should send emails to both final year students
        self.assertEqual(mock_send_email.call_count, 2)
        
        # Verify both students received emails
        all_recipients = []
        for call in mock_send_email.call_args_list:
            # call is (args, kwargs) tuple
            recipient_list = call[1].get('recipient_list', [])
            if recipient_list:
                all_recipients.extend(recipient_list)
        self.assertIn('finalyear@example.com', all_recipients)
        self.assertIn('pgfinal@example.com', all_recipients)
    
    @patch('apps.placements.utils.send_email_in_background')
    def test_send_drive_notification_email_context(self, mock_send_email):
        """
        Test Case ID: PLACEMENTS-UTILS-001-001-005
        Module: Placements App - send_drive_notification
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify email context is correctly formatted
        """
        program_ids = [self.program_4yr.id]
        job_titles = ['Software Engineer', 'Data Scientist']
        deadline = timezone.now() + timezone.timedelta(days=7)
        
        send_drive_notification('Test Company', deadline, program_ids, job_titles)
        
        # Verify email context
        call_args = mock_send_email.call_args
        # call_args is (args, kwargs) tuple, so use [1] for kwargs
        context = call_args[1].get('context', {})
        
        self.assertEqual(context['company_name'], 'Test Company')
        self.assertEqual(context['job_roles'], job_titles)
        self.assertIn('deadline', context)
        self.assertIn('drive_url', context)

