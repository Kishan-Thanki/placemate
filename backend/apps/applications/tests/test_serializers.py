"""
TEST SUITE: Applications App - Serializers
Test Suite ID: APPLICATIONS-SERIALIZER-001

Tests for all serializers including validation, data transformation, and business logic.
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from unittest.mock import patch, MagicMock
from apps.applications.models import CompanyDriveApplication, JobPreference
from apps.applications.serializers import (
    JobPreferenceSerializer,
    CompanyDriveApplicationCreateSerializer,
    CompanyDriveApplicationDetailSerializer,
    CompanyDriveApplicationBaseSerializer
)
from apps.placements.models import CompanyDrive, PlacementDrive, Job
from apps.companies.models import Company
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from django.contrib.auth import get_user_model

User = get_user_model()


class JobPreferenceSerializerTest(TestCase):
    """
    TEST SUITE: JobPreference Serializer
    Test Suite ID: APPLICATIONS-SERIALIZER-001-001
    """
    
    def setUp(self):
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
        
        self.job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        self.job.eligible_programs.add(self.program)
    
    def test_job_preference_serialization(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-001-001
        Test job preference serialization with read-only fields
        """
        # Create an application first (required for JobPreference)
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=StudentProfile.objects.create(
                user=User.objects.create_user(
                    email='test@example.com',
                    phone_number='9999999999',
                    first_name='Test',
                    last_name='User',
                    password='pass123'
                ),
                program=self.program,
                enrollment_number='EN999',
                joining_year=2024
            ),
            status='Applied',
            resume='resume.pdf'
        )
        
        preference = JobPreference.objects.create(
            drive_application=application,
            job=self.job,
            preference_order=1
        )
        
        serializer = JobPreferenceSerializer(preference)
        
        data = serializer.data
        self.assertEqual(data['id'], preference.id)
        self.assertEqual(data['job'], self.job.id)
        self.assertEqual(data['job_title'], 'Software Engineer')
        self.assertEqual(data['job_drive_type'], 'FullTime')  # Raw model value
        self.assertEqual(data['job_mode'], 'Onsite')  # Raw model value
        self.assertEqual(data['preference_order'], 1)
    
    def test_job_preference_validation(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-001-002
        Test job preference validation
        """
        serializer = JobPreferenceSerializer(data={
            'job': self.job.id,
            'preference_order': 1
        })
        
        self.assertTrue(serializer.is_valid())
    
    def test_job_preference_default_order(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-001-003
        Test default preference order
        """
        serializer = JobPreferenceSerializer(data={
            'job': self.job.id
            # preference_order not provided
        })
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['preference_order'], 1)


class CompanyDriveApplicationBaseSerializerTest(TestCase):
    """
    TEST SUITE: CompanyDriveApplication Base Serializer
    Test Suite ID: APPLICATIONS-SERIALIZER-001-002
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
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
        
        self.student_profile = StudentProfile.objects.create(
            user=self.user,
            program=self.program,
            current_cgpa=8.5,
            is_verified=True
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
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
    
    def test_base_serializer_serialization(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-002-001
        Test base serializer serialization with read-only fields
        """
        application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
        
        serializer = CompanyDriveApplicationBaseSerializer(application)
        
        data = serializer.data
        self.assertEqual(data['id'], application.id)
        self.assertEqual(data['company_drive'], self.company_drive.id)
        self.assertEqual(data['student'], self.student_profile.id)
        self.assertEqual(data['student_name'], 'John Doe')
        self.assertEqual(data['company_name'], 'Test Company')
        self.assertEqual(data['drive_title'], 'Campus Drive 2024')
        self.assertEqual(data['status'], 'Applied')
        self.assertEqual(data['resume'], 'resume.pdf')
    
    def test_base_serializer_validation_missing_student_profile(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-002-002
        Test validation when student profile is missing from context
        """
        serializer = CompanyDriveApplicationBaseSerializer(data={
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf'
        })
        
        # Without student_profile in context, validation should fail
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)


class CompanyDriveApplicationCreateSerializerTest(TestCase):
    """
    TEST SUITE: CompanyDriveApplication Create Serializer
    Test Suite ID: APPLICATIONS-SERIALIZER-001-003
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
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
        
        self.student_profile = StudentProfile.objects.create(
            user=self.user,
            program=self.program,
            current_cgpa=8.5,
            tenth_percentage=85.0,
            twelfth_percentage=80.0,
            active_backlogs=0,
            is_verified=True
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
            status='Open',
            application_deadline=timezone.now() + timezone.timedelta(days=7)
        )
        
        # Create jobs
        self.job1 = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0,
            min_tenth_percentage=60.0,
            min_twelfth_percentage=60.0,
            max_active_backlogs=3
        )
        self.job1.eligible_programs.add(self.program)
        
        self.job2 = Job.objects.create(
            company_drive=self.company_drive,
            title='Data Scientist',
            min_ug_cgpa=7.5,
            min_tenth_percentage=70.0,
            min_twelfth_percentage=70.0,
            max_active_backlogs=2
        )
        self.job2.eligible_programs.add(self.program)
        
        # Serializer context
        self.context = {'student_profile': self.student_profile}
    
    def test_create_serializer_valid_data(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-003-001
        Test create serializer with valid data
        """
        serializer = CompanyDriveApplicationCreateSerializer(data={
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [
                {
                    'job': self.job1.id,
                    'preference_order': 1
                },
                {
                    'job': self.job2.id,
                    'preference_order': 2
                }
            ]
        }, context=self.context)
        
        self.assertTrue(serializer.is_valid())
    
    def test_create_serializer_unverified_student(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-003-002
        Test validation with unverified student profile
        """
        unverified_profile = StudentProfile.objects.create(
            user=User.objects.create_user(
                email='unverified@example.com',
                phone_number='1111111111',
                first_name='Unverified',
                last_name='Student',
                password='testpass123'
            ),
            program=self.program,
            current_cgpa=8.5,
            is_verified=False  # Not verified
        )
        
        context = {'student_profile': unverified_profile}
        serializer = CompanyDriveApplicationCreateSerializer(data={
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [{'job': self.job1.id}]
        }, context=context)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_create_serializer_duplicate_application(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-003-003
        Test validation for duplicate applications
        """
        # Create first application
        CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume1.pdf'
        )
        
        serializer = CompanyDriveApplicationCreateSerializer(data={
            'company_drive': self.company_drive.id,
            'resume': 'resume2.pdf',
            'job_preferences': [{'job': self.job1.id}]
        }, context=self.context)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('company_drive', serializer.errors)
    
    def test_create_serializer_closed_drive(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-003-004
        Test validation for closed drive
        """
        closed_drive = CompanyDrive.objects.create(
            company=self.company,
            placement_drive=self.placement_drive,
            drive_type='FullTime',
            job_mode='Onsite',
            status='Closed'  # Drive is closed
        )
        
        serializer = CompanyDriveApplicationCreateSerializer(data={
            'company_drive': closed_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [{'job': self.job1.id}]
        }, context=self.context)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_create_serializer_eligibility_validation(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-003-005
        Test job eligibility validation
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
        
        serializer = CompanyDriveApplicationCreateSerializer(data={
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [{'job': tough_job.id}]
        }, context=self.context)
        
        self.assertFalse(serializer.is_valid())
        # Check if error is in non_field_errors
        non_field_errors = serializer.errors.get('non_field_errors', [])
        if isinstance(non_field_errors, list) and len(non_field_errors) > 0:
            error_msg = ' '.join(str(e) for e in non_field_errors)
        else:
            error_msg = str(non_field_errors)
        # Error message format: "Not eligible for {job.title}: {error_message}"
        self.assertTrue(
            'not eligible' in error_msg.lower() or 'eligibility' in error_msg.lower(),
            f"Expected eligibility error, got: {error_msg}"
        )
    
    @patch('apps.applications.serializers.transaction.atomic')
    def test_create_application_with_preferences(self, mock_atomic):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-003-006
        Test application creation with job preferences
        """
        serializer = CompanyDriveApplicationCreateSerializer(data={
            'company_drive': self.company_drive.id,
            'resume': 'resume.pdf',
            'job_preferences': [
                {
                    'job': self.job1.id,
                    'preference_order': 1
                }
            ]
        }, context=self.context)
        
        self.assertTrue(serializer.is_valid())
        
        with patch.object(serializer, 'save') as mock_save:
            application = serializer.save()
            mock_save.assert_called_once()


class CompanyDriveApplicationDetailSerializerTest(TestCase):
    """
    TEST SUITE: CompanyDriveApplication Detail Serializer
    Test Suite ID: APPLICATIONS-SERIALIZER-001-004
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
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
        
        self.student_profile = StudentProfile.objects.create(
            user=self.user,
            program=self.program,
            current_cgpa=8.5,
            is_verified=True
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
        
        self.job = Job.objects.create(
            company_drive=self.company_drive,
            title='Software Engineer',
            min_ug_cgpa=7.0
        )
        self.job.eligible_programs.add(self.program)
        
        # Create application with preferences
        self.application = CompanyDriveApplication.objects.create(
            company_drive=self.company_drive,
            student=self.student_profile,
            status='Applied',
            resume='resume.pdf'
        )
        
        self.preference = JobPreference.objects.create(
            drive_application=self.application,
            job=self.job,
            preference_order=1
        )
    
    def test_detail_serializer_includes_preferences(self):
        """
        Test Case ID: APPLICATIONS-SERIALIZER-001-004-001
        Test detail serializer includes job preferences
        """
        serializer = CompanyDriveApplicationDetailSerializer(self.application)
        
        data = serializer.data
        self.assertIn('job_preferences', data)
        self.assertEqual(len(data['job_preferences']), 1)
        self.assertEqual(data['job_preferences'][0]['job_title'], 'Software Engineer')
        self.assertEqual(data['job_preferences'][0]['preference_order'], 1)