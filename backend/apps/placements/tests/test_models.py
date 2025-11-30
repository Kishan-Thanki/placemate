"""
TEST SUITE: Placements App - Models
Test Suite ID: PLACEMENTS-MODEL-001

Tests for PlacementDrive, CompanyDrive, Job, and JobProgram models.
"""
from django.test import TestCase
from django.utils import timezone
from apps.placements.models import PlacementDrive, CompanyDrive, Job, JobProgram
from apps.companies.models import Company
from apps.core.models import Program, Degree


class PlacementDriveModelTest(TestCase):
    """
    TEST SUITE: PlacementDrive Model
    Test Suite ID: PLACEMENTS-MODEL-001-001
    """
    
    def test_placement_drive_creation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-001-001
        Module: Placements App - PlacementDrive Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify PlacementDrive can be created
        """
        drive = PlacementDrive.objects.create(
            title='Campus Drive 2024',
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=30)
        )
        
        self.assertEqual(drive.title, 'Campus Drive 2024')
        self.assertIsNotNone(drive.created_at)
        self.assertIsNotNone(drive.updated_at)
    
    def test_placement_drive_string_representation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-001-002
        Module: Placements App - PlacementDrive Model
        Test Type: Unit Test
        Priority: Low
        
        Objective: Verify string representation
        """
        drive = PlacementDrive.objects.create(title='Test Drive')
        self.assertEqual(str(drive), 'Test Drive')


class CompanyDriveModelTest(TestCase):
    """
    TEST SUITE: CompanyDrive Model
    Test Suite ID: PLACEMENTS-MODEL-001-002
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
    
    def test_company_drive_creation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-002-001
        Module: Placements App - CompanyDrive Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify CompanyDrive can be created
        """
        drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        self.assertEqual(drive.company, self.company)
        self.assertEqual(drive.placement_drive, self.placement_drive)
        self.assertEqual(drive.drive_type, 'FullTime')
        self.assertEqual(drive.job_mode, 'Onsite')
        self.assertEqual(drive.status, 'Open')
        self.assertFalse(drive.multiple_allowed)  # Default value
    
    def test_company_drive_drive_type_choices(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-002-002
        Module: Placements App - CompanyDrive Model
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify drive type choices
        """
        drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='Internship',
            job_mode='Remote'
        )
        
        self.assertEqual(drive.drive_type, 'Internship')
    
    def test_company_drive_status_choices(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-002-003
        Module: Placements App - CompanyDrive Model
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify status choices
        """
        drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Hybrid',
            status='Closed'
        )
        
        self.assertEqual(drive.status, 'Closed')
    
    def test_company_drive_string_representation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-002-004
        Module: Placements App - CompanyDrive Model
        Test Type: Unit Test
        Priority: Low
        
        Objective: Verify string representation
        """
        drive = CompanyDrive.objects.create(
            placement_drive=self.placement_drive,
            company=self.company,
            drive_type='FullTime',
            job_mode='Onsite'
        )
        
        expected_str = f"{self.company.name} - {self.placement_drive.title}"
        self.assertEqual(str(drive), expected_str)


class JobModelTest(TestCase):
    """
    TEST SUITE: Job Model
    Test Suite ID: PLACEMENTS-MODEL-001-003
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
            job_mode='Onsite'
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
    
    def test_job_creation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-003-001
        Module: Placements App - Job Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify Job can be created
        """
        job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            description_ug='UG description',
            description_pg='PG description',
            min_ug_cgpa=7.0,
            min_pg_cgpa=7.5,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=3,
            ug_package_min=500000,
            ug_package_max=800000
        )
        
        self.assertEqual(job.title, 'Software Engineer')
        self.assertEqual(job.company_drive, self.company_drive)
        self.assertEqual(job.min_ug_cgpa, 7.0)
        self.assertIsNotNone(job.posted_at)
    
    def test_job_eligible_programs_relationship(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-003-002
        Module: Placements App - Job Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify job-eligible programs relationship
        """
        job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        
        job.eligible_programs.add(self.program)
        
        self.assertEqual(job.eligible_programs.count(), 1)
        self.assertIn(self.program, job.eligible_programs.all())
    
    def test_job_string_representation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-003-003
        Module: Placements App - Job Model
        Test Type: Unit Test
        Priority: Low
        
        Objective: Verify string representation
        """
        job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer'
        )
        
        self.assertEqual(str(job), 'Software Engineer')


class JobProgramModelTest(TestCase):
    """
    TEST SUITE: JobProgram Model
    Test Suite ID: PLACEMENTS-MODEL-001-004
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
            job_mode='Onsite'
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
    
    def test_job_program_creation(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-004-001
        Module: Placements App - JobProgram Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify JobProgram can be created
        """
        job_program = JobProgram.objects.create(
            job=self.job,
            program=self.program
        )
        
        self.assertEqual(job_program.job, self.job)
        self.assertEqual(job_program.program, self.program)
    
    def test_job_program_unique_together(self):
        """
        Test Case ID: PLACEMENTS-MODEL-001-004-002
        Module: Placements App - JobProgram Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify unique together constraint
        """
        JobProgram.objects.create(
            job=self.job,
            program=self.program
        )
        
        # Try to create duplicate
        with self.assertRaises(Exception):
            JobProgram.objects.create(
                job=self.job,
                program=self.program  # Duplicate
            )

