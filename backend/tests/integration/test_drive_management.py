"""
TEST SUITE: Integration Tests - Drive Management
Test Suite ID: INTEGRATION-DRIVE-001

Tests complete drive management workflow from creation to notifications.
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.placements.models import PlacementDrive, CompanyDrive, Job, JobProgram
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class DriveManagementWorkflowTest(TestCase):
    """
    TEST SUITE: Complete Drive Management Workflow
    Test Suite ID: INTEGRATION-DRIVE-001-001
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
        
        # Create student user
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='2222222222',
            first_name='Student',
            last_name='User',
            password='studentpass123'
        )
        self.student_user.roles.add(self.student_role)
        
        # Create program and students
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
        
        # Create final year student (for notifications)
        from datetime import datetime
        current_year = datetime.now().year
        self.final_year_student = User.objects.create_user(
            email='finalyear@example.com',
            phone_number='3333333333',
            first_name='Final',
            last_name='Year',
            password='studentpass123'
        )
        self.final_year_student.roles.add(self.student_role)
        self.final_year_profile = StudentProfile.objects.create(
            user=self.final_year_student,
            program=self.program,
            enrollment_number='EN2021001',
            joining_year=current_year - 3,  # Final year for 4-year program
            is_placed=False,
            is_verified=True
        )
        
        # Create company
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='9999999999'
        )
    
    def _authenticate_admin(self):
        """Helper to authenticate admin"""
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
    
    def _authenticate_student(self):
        """Helper to authenticate student"""
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
    
    def test_create_placement_drive_workflow(self):
        """
        Test Case ID: INTEGRATION-DRIVE-001-001-001
        Module: Integration - Drive Management
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can create placement drive
        """
        self._authenticate_admin()
        
        url = reverse('placement-drive-list')
        data = {
            'title': 'Campus Drive 2024',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timezone.timedelta(days=30)).isoformat()
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlacementDrive.objects.filter(title='Campus Drive 2024').exists())
    
    @patch('apps.placements.utils.send_drive_notification')
    def test_create_company_drive_with_jobs_workflow(self, mock_notification):
        """
        Test Case ID: INTEGRATION-DRIVE-001-001-002
        Module: Integration - Drive Management
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can create company drive with jobs and notifications sent
        """
        # Create placement drive first
        placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        
        self._authenticate_admin()
        
        url = reverse('company-drive-list')
        data = {
            'placement_drive': placement_drive.id,
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
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify company drive created
        company_drive = CompanyDrive.objects.get(company=self.company, drive_type='FullTime')
        self.assertEqual(company_drive.jobs.count(), 1)
        self.assertEqual(company_drive.jobs.first().title, 'Software Engineer')
        
        # Verify notification was called
        mock_notification.assert_called_once()
    
    def test_student_sees_only_open_drives(self):
        """
        Test Case ID: INTEGRATION-DRIVE-001-001-003
        Module: Integration - Drive Management
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify students only see Open drives
        """
        # Create placement drive
        placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        
        # Create open drive
        open_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open'
        )
        
        # Create closed drive
        closed_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='Internship',
            job_mode='Remote',
            status='Closed'
        )
        
        self._authenticate_student()
        
        url = reverse('company-drive-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Student should only see Open drive
        drive_ids = [drive['id'] for drive in response.data['data']]
        self.assertIn(open_drive.id, drive_ids)
        self.assertNotIn(closed_drive.id, drive_ids)
    
    def test_admin_sees_all_drives(self):
        """
        Test Case ID: INTEGRATION-DRIVE-001-001-004
        Module: Integration - Drive Management
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify admin sees all drives (Open and Closed)
        """
        # Create placement drive
        placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        
        # Create open and closed drives
        open_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open'
        )
        
        closed_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='Internship',
            job_mode='Remote',
            status='Closed'
        )
        
        self._authenticate_admin()
        
        url = reverse('company-drive-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see both
        drive_ids = [drive['id'] for drive in response.data['data']]
        self.assertIn(open_drive.id, drive_ids)
        self.assertIn(closed_drive.id, drive_ids)
    
    def test_get_jobs_for_drive(self):
        """
        Test Case ID: INTEGRATION-DRIVE-001-001-005
        Module: Integration - Drive Management
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify users can get jobs for a company drive
        """
        # Create placement drive and company drive
        placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        company_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open'
        )
        
        # Create jobs
        job1 = Job.objects.create(
            company_drive=company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        job1.eligible_programs.add(self.program)
        
        job2 = Job.objects.create(
            company_drive=company_drive,
            title='Data Scientist',
            min_ug_cgpa=7.5
        )
        job2.eligible_programs.add(self.program)
        
        self._authenticate_student()
        
        url = reverse('company-drive-jobs', kwargs={'pk': company_drive.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)
        job_titles = [job['title'] for job in response.data['data']]
        self.assertIn('Software Engineer', job_titles)
        self.assertIn('Data Scientist', job_titles)
    
    def test_add_job_to_existing_drive(self):
        """
        Test Case ID: INTEGRATION-DRIVE-001-001-006
        Module: Integration - Drive Management
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify admin can add job to existing drive
        """
        # Create placement drive and company drive
        placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        company_drive = CompanyDrive.objects.create(
            placement_drive=placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open'
        )
        
        self._authenticate_admin()
        
        url = reverse('job-list')
        data = {
            'company_drive': company_drive.id,
            'title': 'New Software Engineer',
            'description_ug': 'UG description',
            'min_ug_cgpa': '7.0',
            'eligible_programs': [self.program.id]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Job.objects.filter(title='New Software Engineer', company_drive=company_drive).exists())
        self.assertEqual(company_drive.jobs.count(), 1)

