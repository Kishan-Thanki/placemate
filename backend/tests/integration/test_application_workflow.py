"""
TEST SUITE: Integration Tests - Application Workflow
Test Suite ID: INTEGRATION-APP-001

Tests complete application workflow from student application to job offer acceptance.
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.applications.models import CompanyDriveApplication, JobPreference
from apps.placements.models import PlacementDrive, CompanyDrive, Job
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class ApplicationWorkflowTest(TestCase):
    """
    TEST SUITE: Complete Application Workflow
    Test Suite ID: INTEGRATION-APP-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create roles
        self.student_role = Role.objects.create(name='Student')
        self.admin_role = Role.objects.create(name='Admin')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        
        # Create student user
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        self.student_user.roles.add(self.student_role)
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        self.admin_user.roles.add(self.admin_role)
        
        # Create placement user
        self.placement_user = User.objects.create_user(
            email='placement@example.com',
            phone_number='2222222222',
            first_name='Placement',
            last_name='Officer',
            password='placementpass123'
        )
        self.placement_user.roles.add(self.placement_role)
        
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
        
        # Create student profile
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
        
        # Create company and drive
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='9999999999'
        )
        
        self.placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        
        self.company_drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        # Create job
        self.job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=3
        )
        self.job.eligible_programs.add(self.program)
    
    def _authenticate_student(self):
        """Helper to authenticate student"""
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
    
    def _authenticate_admin(self):
        """Helper to authenticate admin"""
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
    
    def _authenticate_placement(self):
        """Helper to authenticate placement team"""
        refresh = RefreshToken.for_user(self.placement_user)
        refresh['active_role'] = 'Student Placement Cell'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
    
    @patch('apps.applications.views.send_email_in_background')
    def test_complete_application_workflow(self, mock_email):
        """
        Test Case ID: INTEGRATION-APP-001-001-001
        Module: Integration - Application Workflow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify complete workflow from application to offer acceptance
        """
        # Step 1: Student applies
        self._authenticate_student()
        apply_url = reverse('applications-list')
        apply_data = {
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [
                {
                    'job': self.job.id,
                    'preference_order': 1
                }
            ]
        }
        apply_response = self.client.post(apply_url, apply_data, format='json')
        self.assertEqual(apply_response.status_code, status.HTTP_201_CREATED)
        application_id = apply_response.data['data']['id']
        
        # Verify application created
        application = CompanyDriveApplication.objects.get(id=application_id)
        self.assertEqual(application.status, 'Applied')
        self.assertEqual(application.student, self.student_profile)
        
        # Step 2: Admin/Placement offers job
        self._authenticate_placement()
        offer_url = reverse('applications-offer-job', kwargs={'pk': application_id})
        offer_data = {'job_id': self.job.id}
        offer_response = self.client.post(offer_url, offer_data, format='json')
        self.assertEqual(offer_response.status_code, status.HTTP_200_OK)
        
        # Verify offer made
        application.refresh_from_db()
        self.assertEqual(application.status, 'Offered')
        self.assertEqual(application.offered_job, self.job)
        self.assertEqual(mock_email.call_count, 1)  # Email sent
        
        # Step 3: Student accepts offer
        self._authenticate_student()
        accept_url = reverse('applications-accept-offer', kwargs={'pk': application_id})
        accept_response = self.client.post(accept_url, {}, format='json')
        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        
        # Verify acceptance
        application.refresh_from_db()
        self.assertEqual(application.status, 'Accepted')
        self.assertEqual(mock_email.call_count, 2)  # Second email sent
    
    def test_application_eligibility_validation(self):
        """
        Test Case ID: INTEGRATION-APP-001-001-002
        Module: Integration - Application Workflow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify eligibility validation prevents ineligible applications
        """
        # Create job with high requirements
        tough_job = Job.objects.create(
            company_drive=self.company_drive,
            title='Senior Engineer',
            min_ug_cgpa=9.5,  # Higher than student's 8.5
            min_tenth_percentage=90.0,
            min_twelfth_percentage=90.0,
            max_active_backlogs=0
        )
        tough_job.eligible_programs.add(self.program)
        
        self._authenticate_student()
        apply_url = reverse('applications-list')
        apply_data = {
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [
                {
                    'job': tough_job.id,
                    'preference_order': 1
                }
            ]
        }
        
        response = self.client.post(apply_url, apply_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('not eligible for senior engineer', str(response.data.get('errors', {})).lower())
    
    def test_duplicate_application_prevention(self):
        """
        Test Case ID: INTEGRATION-APP-001-001-003
        Module: Integration - Application Workflow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify students cannot apply twice to same drive
        """
        # Create first application
        CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume1.pdf'
        )
        
        self._authenticate_student()
        apply_url = reverse('applications-list')
        apply_data = {
            'company_drive': self.company_drive.id,
            'resume': 'resume2.pdf',
            'job_preferences': [
                {
                    'job': self.job.id,
                    'preference_order': 1
                }
            ]
        }
        
        response = self.client.post(apply_url, apply_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('already applied', str(response.data).lower())
    
    def test_application_withdrawal_workflow(self):
        """
        Test Case ID: INTEGRATION-APP-001-001-004
        Module: Integration - Application Workflow
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify student can withdraw application
        """
        # Create application
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
        
        self._authenticate_student()
        withdraw_url = reverse('applications-withdraw', kwargs={'pk': application.id})
        response = self.client.post(withdraw_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify application is deleted
        with self.assertRaises(CompanyDriveApplication.DoesNotExist):
            application.refresh_from_db()
    
    def test_offer_decline_workflow(self):
        """
        Test Case ID: INTEGRATION-APP-001-001-005
        Module: Integration - Application Workflow
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify student can decline job offer
        """
        # Create application with offer
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Offered',
            offered_job=self.job,
            resume='resume.pdf'
        )
        
        self._authenticate_student()
        decline_url = reverse('applications-decline-offer', kwargs={'pk': application.id})
        response = self.client.post(decline_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.status, 'Declined')

