"""
TEST SUITE: E2E Tests - Admin Journey
Test Suite ID: E2E-ADMIN-001

Tests complete end-to-end admin journey from login to managing placements.
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.placements.models import PlacementDrive, CompanyDrive, Job
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.applications.models import CompanyDriveApplication
from apps.core.models import Program, Degree
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AdminJourneyE2ETest(TestCase):
    """
    TEST SUITE: Complete Admin Journey
    Test Suite ID: E2E-ADMIN-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create roles
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        self.admin_user.roles.add(self.admin_role)
        
        # Create program
        self.degree = Degree.objects.create(
            name='Bachelor of Science',
            abbreviation='B.Sc'
        )
        self.program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG',
            duration_years=4,
            degree=self.degree
        )
        
        # Create company
        self.company = Company.objects.create(
            name='Tech Company',
            email='tech@company.com',
            phone_number='9999999999'
        )
        
        # Create student for testing
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='studentpass123'
        )
        self.student_user.roles.add(self.student_role)
        
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            program=self.program,
            enrollment_number='EN2024001',
            current_cgpa=8.5,
            tenth_percentage=85.0,
            twelfth_percentage=80.0,
            active_backlogs=0,
            is_verified=True,
            joining_year=2024
        )
    
    def _authenticate_admin(self):
        """Helper to authenticate admin"""
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
    
    @patch('apps.placements.serializers.send_drive_notification')
    def test_complete_admin_journey(self, mock_notification):
        """
        Test Case ID: E2E-ADMIN-001-001-001
        Module: E2E - Admin Journey
        Test Type: E2E Test
        Priority: High
        
        Objective: Verify complete admin journey from login to managing placements
        """
        # Step 1: Admin logs in
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'admin@example.com',
            'password': 'adminpass123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', login_response.cookies)
        
        # Set tokens
        self.client.cookies['access_token'] = login_response.cookies.get('access_token').value
        self.client.cookies['refresh_token'] = login_response.cookies.get('refresh_token').value
        
        # Step 2: Admin creates placement drive
        placement_url = reverse('placement-drive-list')
        placement_data = {
            'title': 'Campus Drive 2024',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timezone.timedelta(days=30)).isoformat()
        }
        placement_response = self.client.post(placement_url, placement_data, format='json')
        self.assertEqual(placement_response.status_code, status.HTTP_201_CREATED)
        placement_drive_id = placement_response.data['data']['id']
        
        # Step 3: Admin creates company drive with jobs
        company_drive_url = reverse('company-drive-list')
        company_drive_data = {
            'placement_drive': placement_drive_id,
            'company': self.company.id,
            'drive_type': 'FullTime',
            'job_mode': 'Onsite',
            'status': 'Open',
            'application_deadline': (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            'multiple_allowed': False,
            'jobs': [
                {
                    'title': 'Software Engineer',
                    'description_ug': 'UG description',
                    'min_ug_cgpa': '7.0',
                    'min_tenth_percentage': '60.0',
                    'min_twelfth_percentage': '60.0',
                    'max_active_backlogs': 3,
                    'eligible_programs': [self.program.id]
                }
            ]
        }
        company_drive_response = self.client.post(company_drive_url, company_drive_data, format='json')
        self.assertEqual(company_drive_response.status_code, status.HTTP_201_CREATED)
        company_drive_id = company_drive_response.data['data']['id']
        
        # Verify drive and job created
        company_drive = CompanyDrive.objects.get(id=company_drive_id)
        self.assertEqual(company_drive.jobs.count(), 1)
        job = company_drive.jobs.first()
        self.assertEqual(job.title, 'Software Engineer')
        
        # Verify notification was sent
        mock_notification.assert_called_once()
        
        # Step 4: Admin views applications (after student applies)
        # First, student applies (simulate)
        student_refresh = RefreshToken.for_user(self.student_user)
        student_refresh['active_role'] = 'Student'
        student_client = APIClient()
        student_client.cookies['access_token'] = str(student_refresh.access_token)
        student_client.cookies['refresh_token'] = str(student_refresh)
        
        apply_url = reverse('applications-list')
        apply_data = {
            'company_drive': company_drive_id,
            'resume': 'resume.pdf',
            'job_preferences': [
                {
                    'job': job.id,
                    'preference_order': 1
                }
            ]
        }
        apply_response = student_client.post(apply_url, apply_data, format='json')
        self.assertEqual(apply_response.status_code, status.HTTP_201_CREATED)
        application_id = apply_response.data['data']['id']
        
        # Admin views applications
        applications_url = reverse('applications-list')
        applications_response = self.client.get(applications_url)
        self.assertEqual(applications_response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(applications_response.data['data']), 0)
        
        # Step 5: Admin offers job to student
        offer_url = reverse('applications-offer-job', kwargs={'pk': application_id})
        offer_data = {'job_id': job.id}
        offer_response = self.client.post(offer_url, offer_data, format='json')
        self.assertEqual(offer_response.status_code, status.HTTP_200_OK)
        
        # Verify offer made
        application = CompanyDriveApplication.objects.get(id=application_id)
        self.assertEqual(application.status, 'Offered')
        self.assertEqual(application.offered_job, job)
        
        # Step 6: Admin marks student as placed (after acceptance)
        # First student accepts (simulate)
        accept_url = reverse('applications-accept-offer', kwargs={'pk': application_id})
        accept_response = student_client.post(accept_url, {}, format='json')
        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        
        # Admin marks as placed
        mark_placed_url = reverse('mark-student-placed', kwargs={'user_id': self.student_user.id})
        mark_data = {'is_placed': True}
        mark_response = self.client.patch(mark_placed_url, mark_data, format='json')
        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        
        # Verify final state
        self.student_profile.refresh_from_db()
        self.assertTrue(self.student_profile.is_placed)
        application.refresh_from_db()
        self.assertEqual(application.status, 'Accepted')

