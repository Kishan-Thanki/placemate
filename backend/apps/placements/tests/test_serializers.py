"""
TEST SUITE: Placements App - Serializers
Test Suite ID: PLACEMENTS-SERIALIZER-001

Tests for placement serializers including validation and nested creation.
"""
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch
from apps.placements.models import PlacementDrive, CompanyDrive, Job, JobProgram
from apps.placements.serializers import (
    PlacementDriveSerializer,
    CompanyDriveReadSerializer,
    CompanyDriveWriteSerializer,
    JobReadSerializer,
    JobWriteSerializer
)
from apps.companies.models import Company
from apps.core.models import Program, Degree


class PlacementDriveSerializerTest(TestCase):
    """
    TEST SUITE: PlacementDriveSerializer
    Test Suite ID: PLACEMENTS-SERIALIZER-001-001
    """
    
    def test_placement_drive_serializer_create(self):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-001-001
        Module: Placements App - PlacementDriveSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer creates placement drive
        """
        data = {
            'title': 'Campus Drive 2024',
            'start_date': timezone.now().isoformat(),
            'end_date': (timezone.now() + timezone.timedelta(days=30)).isoformat()
        }
        
        serializer = PlacementDriveSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        drive = serializer.save()
        
        self.assertEqual(drive.title, 'Campus Drive 2024')
        self.assertIsNotNone(drive.start_date)
    
    def test_placement_drive_serializer_read(self):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-001-002
        Module: Placements App - PlacementDriveSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer correctly serializes drive data
        """
        drive = PlacementDrive.objects.create(
            title='Test Drive',
            start_date=timezone.now()
        )
        
        serializer = PlacementDriveSerializer(drive)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test Drive')
        self.assertIn('id', data)
        self.assertIn('created_at', data)


class CompanyDriveWriteSerializerTest(TestCase):
    """
    TEST SUITE: CompanyDriveWriteSerializer
    Test Suite ID: PLACEMENTS-SERIALIZER-001-002
    """
    
    def setUp(self):
        """Set up test data"""
        self.placement_drive = PlacementDrive.objects.create(
            title='Campus Drive 2024'
        )
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890'
        )
        
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
    
    @patch('apps.placements.utils.send_drive_notification')
    def test_company_drive_write_serializer_create_with_jobs(self, mock_send_notification):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-002-001
        Module: Placements App - CompanyDriveWriteSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer creates company drive with nested jobs
        """
        data = {
            'placement_drive': self.placement_drive.id,
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
                    'eligible_programs': [self.program.id]
                }
            ]
        }
        
        serializer = CompanyDriveWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        company_drive = serializer.save()
        
        self.assertEqual(company_drive.company, self.company)
        self.assertEqual(company_drive.jobs.count(), 1)
        self.assertEqual(company_drive.jobs.first().title, 'Software Engineer')
        self.assertEqual(company_drive.jobs.first().eligible_programs.count(), 1)
    
    def test_company_drive_write_serializer_requires_jobs(self):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-002-002
        Module: Placements App - CompanyDriveWriteSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify at least one job is required
        """
        data = {
            'placement_drive': self.placement_drive.id,
            'company': self.company.id,
            'drive_type': 'FullTime',
            'job_mode': 'Onsite',
            'jobs': []  # Empty jobs list
        }
        
        serializer = CompanyDriveWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('jobs', serializer.errors)


class JobWriteSerializerTest(TestCase):
    """
    TEST SUITE: JobWriteSerializer
    Test Suite ID: PLACEMENTS-SERIALIZER-001-003
    """
    
    def setUp(self):
        """Set up test data"""
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
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
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
    
    @patch('apps.placements.utils.send_drive_notification')
    def test_job_write_serializer_create(self, mock_send_notification):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-003-001
        Module: Placements App - JobWriteSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer creates job with eligible programs
        """
        data = {
            'company_drive': self.company_drive.id,
            'title': 'Software Engineer',
            'description_ug': 'UG description',
            'description_pg': 'PG description',
            'min_ug_cgpa': '7.0',
            'min_pg_cgpa': '7.5',
            'min_tenth_percentage': '60.0',
            'min_twelfth_percentage': '60.0',
            'max_active_backlogs': 3,
            'ug_package_min': '500000',
            'ug_package_max': '800000',
            'eligible_programs': [self.program.id]
        }
        
        serializer = JobWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        job = serializer.save()
        
        self.assertEqual(job.title, 'Software Engineer')
        self.assertEqual(job.company_drive, self.company_drive)
        self.assertEqual(job.eligible_programs.count(), 1)
        self.assertIn(self.program, job.eligible_programs.all())
    
    @patch('apps.placements.utils.send_drive_notification')
    def test_job_write_serializer_empty_eligible_programs(self, mock_send_notification):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-003-002
        Module: Placements App - JobWriteSerializer
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify job can be created with no eligible programs
        """
        data = {
            'company_drive': self.company_drive.id,
            'title': 'Software Engineer',
            'eligible_programs': []  # Empty list
        }
        
        serializer = JobWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        job = serializer.save()
        
        self.assertEqual(job.eligible_programs.count(), 0)


class JobReadSerializerTest(TestCase):
    """
    TEST SUITE: JobReadSerializer
    Test Suite ID: PLACEMENTS-SERIALIZER-001-004
    """
    
    def setUp(self):
        """Set up test data"""
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
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
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
        
        self.job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        self.job.eligible_programs.add(self.program)
    
    def test_job_read_serializer_includes_nested_data(self):
        """
        Test Case ID: PLACEMENTS-SERIALIZER-001-004-001
        Module: Placements App - JobReadSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer includes nested program data
        """
        serializer = JobReadSerializer(self.job)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Software Engineer')
        self.assertIn('eligible_programs', data)
        self.assertEqual(len(data['eligible_programs']), 1)
        self.assertEqual(data['eligible_programs'][0]['name'], 'Computer Science')
        self.assertIn('company_name', data)
        self.assertIn('drive_title', data)

