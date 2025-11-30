"""
TEST SUITE: Students App - Serializers
Test Suite ID: STUDENTS-SERIALIZER-001

Tests for StudentProfile serializers including validation and data transformation.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile
from apps.students.serializers import (
    StudentRegistrationSerializer,
    StudentProfileSerializer,
    StudentDetailSerializer,
    StudentPlacementSerializer
)
from apps.core.models import Program, Degree
from apps.users.models import Role

User = get_user_model()


class StudentRegistrationSerializerTest(TestCase):
    """
    TEST SUITE: StudentRegistrationSerializer
    Test Suite ID: STUDENTS-SERIALIZER-001-001
    """
    
    def setUp(self):
        """Set up test data"""
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
        self.student_role = Role.objects.create(name='Student')
    
    def test_student_registration_serializer_valid_data(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-001-001
        Module: Students App - StudentRegistrationSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer creates user and profile with valid data
        """
        data = {
            'email': 'newstudent@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'enrollment_number': 'EN2024001',
            'program': self.program.id,
            'joining_year': 2024
        }
        
        serializer = StudentRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        profile = serializer.save()
        
        # Verify user was created
        user = User.objects.get(email='newstudent@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        
        # Verify profile was created
        self.assertEqual(profile.enrollment_number, 'EN2024001')
        self.assertEqual(profile.program, self.program)
        self.assertEqual(profile.user, user)
        
        # Verify Student role was assigned
        self.assertTrue(user.roles.filter(name='Student').exists())
    
    def test_student_registration_serializer_duplicate_email(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-001-002
        Module: Students App - StudentRegistrationSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer rejects duplicate email
        """
        User.objects.create_user(
            email='existing@example.com',
            phone_number='1111111111',
            first_name='Existing',
            last_name='User',
            password='pass123'
        )
        
        data = {
            'email': 'existing@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'enrollment_number': 'EN2024001',
            'program': self.program.id,
            'joining_year': 2024
        }
        
        serializer = StudentRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_student_registration_serializer_duplicate_enrollment(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-001-003
        Module: Students App - StudentRegistrationSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer rejects duplicate enrollment number
        """
        user1 = User.objects.create_user(
            email='student1@example.com',
            phone_number='1111111111',
            first_name='Student',
            last_name='One',
            password='pass123'
        )
        StudentProfile.objects.create(
            user=user1,
            program=self.program,
            enrollment_number='EN2024001',
            joining_year=2024
        )
        
        data = {
            'email': 'student2@example.com',
            'phone_number': '2222222222',
            'first_name': 'Student',
            'last_name': 'Two',
            'enrollment_number': 'EN2024001',  # Duplicate
            'program': self.program.id,
            'joining_year': 2024
        }
        
        serializer = StudentRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('enrollment_number', serializer.errors)
    
    def test_student_registration_serializer_invalid_phone(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-001-004
        Module: Students App - StudentRegistrationSerializer
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify phone number validation (duplicate check)
        """
        # Create a user with existing phone number
        User.objects.create_user(
            email='existing@example.com',
            phone_number='1234567890',
            first_name='Existing',
            last_name='User',
            password='pass123'
        )
        
        data = {
            'email': 'student@example.com',
            'phone_number': '1234567890',  # Duplicate
            'first_name': 'John',
            'last_name': 'Doe',
            'enrollment_number': 'EN2024001',
            'program': self.program.id,
            'joining_year': 2024
        }
        
        serializer = StudentRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone_number', serializer.errors)


class StudentProfileSerializerTest(TestCase):
    """
    TEST SUITE: StudentProfileSerializer
    Test Suite ID: STUDENTS-SERIALIZER-001-002
    """
    
    def setUp(self):
        """Set up test data"""
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
        
        self.profile = StudentProfile.objects.create(
            user=self.user,
            program=self.program,
            enrollment_number='EN2024001',
            current_cgpa=8.5,
            tenth_percentage=85.0,
            twelfth_percentage=80.0,
            joining_year=2024
        )
    
    def test_student_profile_serializer_read(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-002-001
        Module: Students App - StudentProfileSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer correctly serializes profile data
        """
        serializer = StudentProfileSerializer(self.profile)
        data = serializer.data
        
        self.assertEqual(data['enrollment_number'], 'EN2024001')
        self.assertEqual(float(data['current_cgpa']), 8.5)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'student@example.com')
        self.assertEqual(data['user']['first_name'], 'John')
    
    def test_student_profile_serializer_update(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-002-002
        Module: Students App - StudentProfileSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer allows updating profile fields
        """
        data = {
            'current_cgpa': '9.0',
            'tenth_percentage': '90.0',
            'twelfth_percentage': '85.0'
        }
        
        serializer = StudentProfileSerializer(
            self.profile,
            data=data,
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_profile = serializer.save()
        
        self.assertEqual(updated_profile.current_cgpa, 9.0)
        self.assertEqual(updated_profile.tenth_percentage, 90.0)
    
    def test_student_profile_serializer_read_only_fields(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-002-003
        Module: Students App - StudentProfileSerializer
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify read-only fields cannot be updated
        """
        data = {
            'enrollment_number': 'EN2024999',  # Read-only
            'program': self.program.id,  # Read-only
            'is_placed': True  # Read-only
        }
        
        serializer = StudentProfileSerializer(
            self.profile,
            data=data,
            partial=True
        )
        self.assertTrue(serializer.is_valid())
        
        # Read-only fields should not be updated
        updated_profile = serializer.save()
        self.assertEqual(updated_profile.enrollment_number, 'EN2024001')  # Original value
        self.assertFalse(updated_profile.is_placed)  # Original value


class StudentPlacementSerializerTest(TestCase):
    """
    TEST SUITE: StudentPlacementSerializer
    Test Suite ID: STUDENTS-SERIALIZER-001-003
    """
    
    def setUp(self):
        """Set up test data"""
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
        
        self.profile = StudentProfile.objects.create(
            user=self.user,
            program=self.program,
            enrollment_number='EN2024001',
            is_placed=False,
            joining_year=2024
        )
    
    def test_student_placement_serializer_update(self):
        """
        Test Case ID: STUDENTS-SERIALIZER-001-003-001
        Module: Students App - StudentPlacementSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify serializer updates placement status
        """
        data = {'is_placed': True}
        
        serializer = StudentPlacementSerializer(
            self.profile,
            data=data,
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_profile = serializer.save()
        
        self.assertTrue(updated_profile.is_placed)

