"""
TEST SUITE: Applications App - Models
Test Suite ID: APPLICATIONS-MODEL-001

Tests for CompanyDriveApplication and JobPreference models.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.applications.models import CompanyDriveApplication, JobPreference
from apps.placements.models import CompanyDrive, PlacementDrive, Job
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from django.contrib.auth import get_user_model

User = get_user_model()


def create_student_profile(user, program, enrollment_number, **overrides):
    """Helper to create a verified student profile with required fields."""
    default_data = {
        'program': program,
        'enrollment_number': enrollment_number,
        'current_cgpa': 8.5,
        'tenth_percentage': 85.0,
        'twelfth_percentage': 80.0,
        'active_backlogs': 0,
        'is_verified': True,
    }
    default_data.update(overrides)
    return StudentProfile.objects.create(user=user, **default_data)


class CompanyDriveApplicationModelTest(TestCase):
    """
    TEST SUITE: CompanyDriveApplication Model
    Test Suite ID: APPLICATIONS-MODEL-001-001
    """
    
    def setUp(self):
        # Create users
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='testpass123'
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
        
        # Create student profile
        self.student_profile = create_student_profile(
            user=self.student_user,
            program=self.program,
            enrollment_number='ENR-APP-001'
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
        
        # Create job
        self.job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            description_ug='Software development role',
            min_ug_cgpa=7.0,
            min_pg_cgpa=7.5,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=3
        )
        self.job.eligible_programs.add(self.program)
    
    def test_application_creation(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-001-001
        Test CompanyDriveApplication creation with valid data
        """
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
        
        self.assertEqual(application.company_drive, self.company_drive)
        self.assertEqual(application.student, self.student_profile)
        self.assertEqual(application.status, 'Applied')
        self.assertEqual(application.resume, 'resume.pdf')
        self.assertIsNotNone(application.applied_at)
        self.assertIsNotNone(application.updated_at)
    
    def test_application_unique_together_constraint(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-001-002
        Test that a student can't apply to the same drive multiple times
        """
        CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume1.pdf'
        )
        
        with self.assertRaises(Exception):
            CompanyDriveApplication.objects.create(
                company_drive=self.company_drive,
                student=self.student_profile,
                status='Applied',
                resume='resume2.pdf'
            )
    
    def test_application_status_choices(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-001-003
        Test application status choices validation
        """
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Offered',
            resume='resume.pdf'
        )
        
        # Test valid status
        application.status = 'Accepted'
        application.save()
        self.assertEqual(application.status, 'Accepted')
        
        # Test invalid status
        with self.assertRaises(ValidationError):
            application.status = 'InvalidStatus'
            application.full_clean()
    
    def test_application_string_representation(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-001-004
        Test application string representation
        """
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
        
        expected_str = f"Application for {self.company_drive} by {self.student_profile}"
        self.assertEqual(str(application), expected_str)
    
    def test_application_ordering(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-001-005
        Test applications are ordered by applied_at descending
        """
        # Create multiple applications
        app1 = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume1.pdf'
        )
        
        # Create another student for second application
        student_user2 = User.objects.create_user(
            email='student2@example.com',
            phone_number='0987654321',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )
        student_profile2 = create_student_profile(
            user=student_user2,
            program=self.program,
            enrollment_number='ENR-APP-002',
            current_cgpa=8.0,
            tenth_percentage=80.0,
            twelfth_percentage=75.0
        )
        
        app2 = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=student_profile2,
            status='Applied',
            resume='resume2.pdf'
        )
        
        # Refresh from database to ensure ordering
        app1.refresh_from_db()
        app2.refresh_from_db()
        
        # Get applications ordered by applied_at (most recent first)
        applications = list(CompanyDriveApplication.objects.order_by('-applied_at'))
        # Most recent first (app2 was created after app1)
        # Note: If timestamps are identical, order by ID descending
        if applications[0].applied_at == applications[1].applied_at:
            applications = list(CompanyDriveApplication.objects.order_by('-id'))
        self.assertEqual(applications[0].id, app2.id)
        self.assertEqual(applications[1].id, app1.id)


class JobPreferenceModelTest(TestCase):
    """
    TEST SUITE: JobPreference Model
    Test Suite ID: APPLICATIONS-MODEL-001-002
    """
    
    def setUp(self):
        # Set up the same data as previous test class
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='testpass123'
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
        
        self.student_profile = create_student_profile(
            user=self.student_user,
            program=self.program,
            enrollment_number='ENR-APP-101'
        )
        
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
            status='Open'
        )
        
        # Create multiple jobs
        self.job1 = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            description_ug='Software development role',
            min_ug_cgpa=7.0
        )
        self.job1.eligible_programs.add(self.program)
        
        self.job2 = Job.objects.create(
            company_drive=self.company_drive,
            title='Data Scientist',
            description_ug='Data analysis role',
            min_ug_cgpa=7.5
        )
        self.job2.eligible_programs.add(self.program)
        
        # Create application
        self.application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
    
    def test_job_preference_creation(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-002-001
        Test JobPreference creation with valid data
        """
        preference = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job1,
            preference_order=1
        )
        
        self.assertEqual(preference.drive_application, self.application)
        self.assertEqual(preference.job, self.job1)
        self.assertEqual(preference.preference_order, 1)
    
    def test_job_preference_unique_together_constraints(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-002-002
        Test job preference unique constraints
        """
        JobPreference.objects.create(
            drive_application=self.application,
            job=self.job1,
            preference_order=1
        )
        
        # Test same job in same application
        with self.assertRaises(Exception):
            JobPreference.objects.create(
                drive_application=self.application,
                job=self.job1,
                preference_order=2
            )
        
        # Test same preference order in same application
        with self.assertRaises(Exception):
            JobPreference.objects.create(
                drive_application=self.application,
                job=self.job2,
                preference_order=1
            )
    
    def test_job_preference_ordering(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-002-003
        Test job preferences are ordered by preference_order
        """
        preference2 = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job2,
            preference_order=2
        )
        
        preference1 = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job1,
            preference_order=1
        )
        
        preferences = JobPreference.objects.all()
        self.assertEqual(preferences[0], preference1)  # Order 1 first
        self.assertEqual(preferences[1], preference2)  # Order 2 second
    
    def test_job_preference_string_representation(self):
        """
        Test Case ID: APPLICATIONS-MODEL-001-002-004
        Test job preference string representation
        """
        preference = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job1,
            preference_order=1
        )
        
        expected_str = f"{self.student_profile} - {self.job1.title} (Pref: 1)"
        self.assertEqual(str(preference), expected_str)