"""
TEST SUITE: Applications App - Views
Test Suite ID: APPLICATIONS-VIEW-001

Tests for CompanyDriveApplicationViewSet and all custom actions.
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
from rest_framework_simplejwt.tokens import RefreshToken
from apps.applications.models import CompanyDriveApplication, JobPreference
from apps.placements.models import CompanyDrive, PlacementDrive, Job
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from apps.users.models import Role
from django.contrib.auth import get_user_model

User = get_user_model()


class CompanyDriveApplicationViewSetTest(APITestCase):
    """
    TEST SUITE: CompanyDriveApplication ViewSet
    Test Suite ID: APPLICATIONS-VIEW-001-001
    """
    
    def setUp(self):
        self.client = APIClient()
        
        # Create roles
        self.student_role = Role.objects.create(name='Student')
        self.admin_role = Role.objects.create(name='Admin')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        
        # Create users
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        self.student_user.roles.add(self.student_role)
        
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='0987654321',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        self.admin_user.roles.add(self.admin_role)
        
        self.placement_user = User.objects.create_user(
            email='placement@example.com',
            phone_number='1111111111',
            first_name='Placement',
            last_name='Officer',
            password='placementpass123'
        )
        self.placement_user.roles.add(self.placement_role)
        
        # Create degree and program
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
        
        # Create student profiles
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            program=self.program,
            current_cgpa=8.5,
            tenth_percentage=85.0,
            twelfth_percentage=80.0,
            active_backlogs=0,
            is_verified=True
        )
        
        # Create company and drive
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890'
        )
        
        self.placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        
        self.company_drive = CompanyDrive.objects.create(
            company=self.company,
            placement_drive=self.placement_drive,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        # Create jobs
        self.job1 = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            description_ug='Software development role',
            min_ug_cgpa=7.0,
            min_pg_cgpa=7.5,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=3
        )
        self.job1.eligible_programs.add(self.program)
        
        self.job2 = Job.objects.create(
            company_drive=self.company_drive,
            title='Data Scientist',
            description_ug='Data analysis role',
            min_ug_cgpa=7.5,
            min_pg_cgpa=8.0,
            min_tenth_percentage=70.0,
            min_twelfth_percentage=70.0,
            max_active_backlogs=2
        )
        self.job2.eligible_programs.add(self.program)
        
        # Create application
        self.application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
        
        # Create job preferences
        self.preference1 = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job1,
            preference_order=1
        )
        self.preference2 = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job2,
            preference_order=2
        )
    
    def test_list_applications_student(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-001
        Test student can only see their own applications
        """
        # Create another student's application
        other_student_user = User.objects.create_user(
            email='other@example.com',
            phone_number='2222222222',
            first_name='Other',
            last_name='Student',
            password='testpass123'
        )
        other_student_user.roles.add(self.student_role)
        other_student_profile = StudentProfile.objects.create(
            user=other_student_user,
            program=self.program,
            current_cgpa=8.0,
            is_verified=True
        )
        other_application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=other_student_profile,
            status='Applied',
            resume='other_resume.pdf'
        )
        
        # Authenticate as student
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.get('/api/v1/applications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)  # Only own application
        self.assertEqual(response.data['data'][0]['id'], self.application.id)
    
    def test_list_applications_admin(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-002
        Test admin can see all applications
        """
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.get('/api/v1/applications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all applications
        self.assertGreaterEqual(len(response.data['data']), 1)
    
    def test_create_application_student_success(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-003
        Test student can create application with valid data
        """
        # Create a new drive for this test
        new_drive = CompanyDrive.objects.create(
            company=self.company,
            placement_drive=self.placement_drive,
            drive_type='Internship',
            job_mode='Remote',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        new_job = Job.objects.create(
            company_drive=new_drive,
            title='Intern Developer',
            min_ug_cgpa=6.5,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=5
        )
        new_job.eligible_programs.add(self.program)
        
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {
            'company_drive': new_drive.id,
            'resume': 'new_resume.pdf',
            'job_preferences': [
                {
                    'job': new_job.id,
                    'preference_order': 1
                }
            ]
        }
        
        response = self.client.post('/api/v1/applications/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['company_drive'], new_drive.id)
        self.assertEqual(response.data['data']['student'], self.student_profile.id)
    
    def test_create_application_unauthenticated(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-004
        Test unauthenticated user cannot create application
        """
        data = {
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [{'job': self.job1.id}]
        }
        
        response = self.client.post('/api/v1/applications/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_application_non_student(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-005
        Test non-student user cannot create application
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [{'job': self.job1.id}]
        }
        
        response = self.client.post('/api/v1/applications/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_retrieve_application_detail(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-006
        Test retrieving application details with preferences
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.get(f'/api/v1/applications/{self.application.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['id'], self.application.id)
        self.assertIn('job_preferences', response.data['data'])
        self.assertEqual(len(response.data['data']['job_preferences']), 2)
    
    @patch('apps.core.tasks.send_email_in_background')
    def test_withdraw_application(self, mock_send_email):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-007
        Test student can withdraw application
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.post(f'/api/v1/applications/{self.application.id}/withdraw/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Application withdrawn successfully')
        
        # Verify status changed
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'Withdrawn')
    
    def test_withdraw_non_applied_application(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-008
        Test cannot withdraw non-Applied application
        """
        # Set application to offered status
        self.application.status = 'Offered'
        self.application.save()
        
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.post(f'/api/v1/applications/{self.application.id}/withdraw/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Can only withdraw', response.data['message'])
    
    @patch('apps.core.tasks.send_email_in_background')
    def test_accept_offer(self, mock_send_email):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-009
        Test student can accept job offer
        """
        # Set application to offered status with a job
        self.application.status = 'Offered'
        self.application.offered_job = self.job1
        self.application.save()
        
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.post(f'/api/v1/applications/{self.application.id}/accept_offer/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Job offer accepted successfully')
        
        # Verify status changed
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'Accepted')
        
        # Verify email was sent
        mock_send_email.assert_called_once()
    
    def test_accept_offer_without_offer(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-010
        Test cannot accept offer when no offer exists
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.post(f'/api/v1/applications/{self.application.id}/accept_offer/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No job offer to accept', response.data['message'])
    
    @patch('apps.core.tasks.send_email_in_background')
    def test_offer_job_by_placement_team(self, mock_send_email):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-011
        Test placement team can offer job to application
        """
        refresh = RefreshToken.for_user(self.placement_user)
        refresh['active_role'] = 'Student Placement Cell'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {'job_id': self.job1.id}
        response = self.client.post(f'/api/v1/applications/{self.application.id}/offer_job/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Job offered successfully')
        
        # Verify status and job changed
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'Offered')
        self.assertEqual(self.application.offered_job, self.job1)
        
        # Verify email was sent
        mock_send_email.assert_called_once()
    
    def test_offer_job_unauthorized(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-012
        Test student cannot offer job
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {'job_id': self.job1.id}
        response = self.client.post(f'/api/v1/applications/{self.application.id}/offer_job/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_offer_job_wrong_drive(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-013
        Test cannot offer job from different drive
        """
        # Create another drive and job
        other_drive = CompanyDrive.objects.create(
            company=self.company,
            placement_drive=self.placement_drive,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open'
        )
        other_job = Job.objects.create(
            company_drive=other_drive,
            title='Other Job',
            min_ug_cgpa=7.0
        )
        
        refresh = RefreshToken.for_user(self.placement_user)
        refresh['active_role'] = 'Student Placement Cell'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {'job_id': other_job.id}
        response = self.client.post(f'/api/v1/applications/{self.application.id}/offer_job/', data)
        
        # ValidationErrorResponse returns 422, not 400
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        # Check error in errors field (ValidationErrorResponse format)
        error_msg = str(response.data.get('errors', {}).get('job_id', '')) + ' ' + str(response.data.get('message', ''))
        self.assertIn('does not belong', error_msg)
    
    def test_reject_application(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-014
        Test placement team can reject application
        """
        refresh = RefreshToken.for_user(self.placement_user)
        refresh['active_role'] = 'Student Placement Cell'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.post(f'/api/v1/applications/{self.application.id}/reject/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Application rejected successfully')
        
        # Verify status changed
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'Rejected')
    
    def test_filter_applications_by_status(self):
        """
        Test Case ID: APPLICATIONS-VIEW-001-001-015
        Test filtering applications by status
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        response = self.client.get('/api/v1/applications/?status=Applied')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return applications with Applied status
        for app in response.data['data']:
            self.assertEqual(app['status'], 'Applied')