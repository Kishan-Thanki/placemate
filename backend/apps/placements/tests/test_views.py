"""
TEST SUITE: Placements App - Views
Test Suite ID: PLACEMENTS-VIEWS-001

Tests for PlacementDriveViewSet, CompanyDriveViewSet, and JobViewSet.
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
from apps.core.models import Program, Degree
from apps.users.models import Role
from apps.students.models import StudentProfile
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def create_verified_profile(user, enrollment_number, program=None, **overrides):
    payload = {
        'program': program,
        'enrollment_number': enrollment_number,
        'current_cgpa': 8.0,
        'tenth_percentage': 80.0,
        'twelfth_percentage': 78.0,
        'active_backlogs': 0,
        'is_verified': True,
    }
    payload.update(overrides)
    profile, _ = StudentProfile.objects.update_or_create(user=user, defaults=payload)
    return profile


class PlacementDriveViewSetTest(TestCase):
    """
    TEST SUITE: PlacementDriveViewSet
    Test Suite ID: PLACEMENTS-VIEWS-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        admin_role = Role.objects.create(name='Admin')
        self.admin_user.roles.add(admin_role)
        
        # Authenticate admin
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        # Create test drive
        self.drive = PlacementDrive.objects.create(
            title='Campus Drive 2024',
            start_date=timezone.now()
        )
    
    def test_list_placement_drives_admin(self):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-001-001
        Module: Placements App - PlacementDriveViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can list placement drives
        """
        url = reverse('placement-drive-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
    
    def test_create_placement_drive_admin(self):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-001-002
        Module: Placements App - PlacementDriveViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can create placement drive
        """
        data = {
            'title': 'New Campus Drive 2025',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timezone.timedelta(days=30)).isoformat()
        }
        
        url = reverse('placement-drive-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlacementDrive.objects.filter(title='New Campus Drive 2025').exists())


class CompanyDriveViewSetTest(TestCase):
    """
    TEST SUITE: CompanyDriveViewSet
    Test Suite ID: PLACEMENTS-VIEWS-001-002
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        admin_role = Role.objects.create(name='Admin')
        self.admin_user.roles.add(admin_role)
        
        # Create student user
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='2222222222',
            first_name='Student',
            last_name='User',
            password='studentpass123'
        )
        student_role = Role.objects.create(name='Student')
        self.student_user.roles.add(student_role)
        create_verified_profile(self.student_user, 'PLAC-STU-010')
        create_verified_profile(self.student_user, 'PLAC-STU-001')
        
        # Create placement drive and company
        self.placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890'
        )
        
        # Create company drive
        self.company_drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        # Create closed drive
        self.closed_drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='Internship',
            job_mode='Remote',
            status='Closed',
            application_deadline=timezone.now() + timezone.timedelta(days=14)
        )
    
    def test_list_company_drives_authenticated(self):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-002-001
        Module: Placements App - CompanyDriveViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify authenticated users can list company drives
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('company-drive-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Students should only see Open drives
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['status'], 'Open')
    
    def test_list_company_drives_admin_sees_all(self):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-002-002
        Module: Placements App - CompanyDriveViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin sees all drives (Open and Closed)
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('company-drive-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)
    
    @patch('apps.placements.utils.send_drive_notification')
    def test_create_company_drive_admin_only(self, mock_send_notification):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-002-003
        Module: Placements App - CompanyDriveViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify only admin can create company drives
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
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
        
        data = {
            'placement_drive': self.placement_drive.id,
            'company': self.company.id,
            'drive_type': 'FullTime',
            'job_mode': 'Hybrid',
            'status': 'Open',
            'application_deadline': (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            'multiple_allowed': False,
            'jobs': [
                {
                    'title': 'New Software Engineer',
                    'description_ug': 'UG description',
                    'min_ug_cgpa': '7.0',
                    'eligible_programs': [self.program.id]
                }
            ]
        }
        
        url = reverse('company-drive-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CompanyDrive.objects.filter(company=self.company, drive_type='FullTime', job_mode='Hybrid').exists())
    
    def test_get_company_drive_jobs(self):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-002-004
        Module: Placements App - CompanyDriveViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify users can get jobs for a company drive
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        # Create job for the drive
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
        
        job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        job.eligible_programs.add(self.program)
        
        url = reverse('company-drive-jobs', kwargs={'pk': self.company_drive.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['title'], 'Software Engineer')


class JobViewSetTest(TestCase):
    """
    TEST SUITE: JobViewSet
    Test Suite ID: PLACEMENTS-VIEWS-001-003
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        admin_role = Role.objects.create(name='Admin')
        self.admin_user.roles.add(admin_role)
        
        # Create student user
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='2222222222',
            first_name='Student',
            last_name='User',
            password='studentpass123'
        )
        student_role = Role.objects.create(name='Student')
        self.student_user.roles.add(student_role)
        
        # Create placement drive, company, and company drive
        self.placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890'
        )
        self.company_drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=10)
        )
        
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
        
        # Create job
        self.job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        self.job.eligible_programs.add(self.program)
    
    def test_list_jobs_authenticated(self):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-003-001
        Module: Placements App - JobViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify authenticated users can list jobs
        """
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('job-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
    
    @patch('apps.placements.utils.send_drive_notification')
    def test_create_job_admin_only(self, mock_send_notification):
        """
        Test Case ID: PLACEMENTS-VIEWS-001-003-002
        Module: Placements App - JobViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify only admin can create jobs
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {
            'company_drive': self.company_drive.id,
            'title': 'Data Scientist',
            'description_ug': 'UG description',
            'min_ug_cgpa': '7.5',
            'eligible_programs': [self.program.id]
        }
        
        url = reverse('job-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Job.objects.filter(title='Data Scientist').exists())

