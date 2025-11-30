"""
TEST SUITE: E2E Tests - Student Journey
Test Suite ID: E2E-STUDENT-001

Tests complete end-to-end student journey from registration to job acceptance.
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.applications.models import CompanyDriveApplication
from apps.placements.models import PlacementDrive, CompanyDrive, Job
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class StudentJourneyE2ETest(TestCase):
    """
    TEST SUITE: Complete Student Journey
    Test Suite ID: E2E-STUDENT-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create roles
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        
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
        
        # Create company
        self.company = Company.objects.create(
            name='Tech Company',
            email='tech@company.com',
            phone_number='9999999999'
        )
    
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
    
    @patch('apps.core.tasks.send_email_in_background')
    def test_complete_student_journey(self, mock_email):
        """
        Test Case ID: E2E-STUDENT-001-001-001
        Module: E2E - Student Journey
        Test Type: E2E Test
        Priority: High
        
        Objective: Verify complete student journey from registration to job acceptance
        """
        # Step 1: Admin registers student
        self._authenticate_admin()
        register_url = reverse('student-register')
        register_data = {
            'email': 'newstudent@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'enrollment_number': 'EN2024001',
            'program': self.program.id,
            'joining_year': 2024
        }
        register_response = self.client.post(register_url, register_data, format='json')
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        
        # Verify student created
        student_user = User.objects.get(email='newstudent@example.com')
        self.assertTrue(student_user.roles.filter(name='Student').exists())
        student_profile = StudentProfile.objects.get(user=student_user)
        self.assertEqual(student_profile.enrollment_number, 'EN2024001')
        
        # Step 2: Student logs in
        self.client.cookies.clear()
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'newstudent@example.com',
            'password': register_response.data['data'].get('password', '')  # Password from response
        }
        # Note: In real scenario, password would be in welcome email
        # For test, we'll use the user's actual password from UserManager
        # Let's authenticate directly
        refresh = RefreshToken.for_user(student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
        
        # Step 3: Student updates profile
        profile_url = reverse('current-student')
        profile_data = {
            'current_cgpa': '8.5',
            'tenth_percentage': '85.0',
            'twelfth_percentage': '80.0',
            'active_backlogs': 0
        }
        profile_response = self.client.patch(profile_url, profile_data, format='json')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        # Verify profile updated
        student_profile.refresh_from_db()
        self.assertEqual(student_profile.current_cgpa, 8.5)
        
        # Step 4: Admin creates placement drive and company drive
        self._authenticate_admin()
        
        # Create placement drive
        placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        
        # Create company drive with job
        company_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        job = Job.objects.create(
            company_drive=company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=3
        )
        job.eligible_programs.add(self.program)
        
        # Mark student as verified
        student_profile.is_verified = True
        student_profile.save()
        
        # Step 5: Student views available drives
        self.client.cookies.clear()
        refresh = RefreshToken.for_user(student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
        
        drives_url = reverse('company-drive-list')
        drives_response = self.client.get(drives_url)
        self.assertEqual(drives_response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(drives_response.data['data']), 0)
        
        # Step 6: Student applies to drive
        apply_url = reverse('applications-list')
        apply_data = {
            'company_drive': company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [
                {
                    'job': job.id,
                    'preference_order': 1
                }
            ]
        }
        apply_response = self.client.post(apply_url, apply_data, format='json')
        self.assertEqual(apply_response.status_code, status.HTTP_201_CREATED)
        application_id = apply_response.data['data']['id']
        
        # Step 7: Placement team offers job
        self._authenticate_placement()
        offer_url = reverse('applications-offer-job', kwargs={'pk': application_id})
        offer_data = {'job_id': job.id}
        offer_response = self.client.post(offer_url, offer_data, format='json')
        self.assertEqual(offer_response.status_code, status.HTTP_200_OK)
        
        # Step 8: Student accepts offer
        self.client.cookies.clear()
        refresh = RefreshToken.for_user(student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
        
        accept_url = reverse('applications-accept-offer', kwargs={'pk': application_id})
        accept_response = self.client.post(accept_url, {}, format='json')
        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        
        # Step 9: Admin marks student as placed
        self._authenticate_admin()
        mark_placed_url = reverse('mark-student-placed', kwargs={'user_id': student_user.id})
        mark_data = {'is_placed': True}
        mark_response = self.client.patch(mark_placed_url, mark_data, format='json')
        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        
        # Verify final state
        student_profile.refresh_from_db()
        self.assertTrue(student_profile.is_placed)
        
        application = CompanyDriveApplication.objects.get(id=application_id)
        self.assertEqual(application.status, 'Accepted')

