from django.test import TestCase

# Create your tests here.
"""
Tests for the Students App.

This module contains comprehensive test cases for all student-related
functionality, including registration, profile management, and permissions.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.users.models import Role
from .models import StudentProfile
from apps.core.models import Program

User = get_user_model()


class StudentRegistrationTests(APITestCase):
    """
    Test cases for student registration functionality.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@placemate.com',
            phone_number='1234567890',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.admin_user.roles.add(self.admin_role)
        
        # Create student role
        self.student_role = Role.objects.create(name='Student')
        
        # Create program
        self.program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_admin_can_register_student(self):
        """Test that admin can successfully register a new student."""
        url = '/api/v1/students/register/'
        data = {
            'email': 'newstudent@placemate.com',
            'phone_number': '9876543210',
            'first_name': 'New',
            'last_name': 'Student',
            'enrollment_number': 'CS2024001',
            'program': self.program.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['success'], True)
        self.assertEqual(response.data['message'], "Student registered successfully. Welcome email sent with credentials.")
        
        # Verify user was created
        user = User.objects.get(email='newstudent@placemate.com')
        self.assertEqual(user.first_name, 'New')
        self.assertEqual(user.roles.count(), 1)
        self.assertEqual(user.roles.first().name, 'Student')
        
        # Verify student profile was created
        profile = StudentProfile.objects.get(user=user)
        self.assertEqual(profile.enrollment_number, 'CS2024001')
        self.assertEqual(profile.program, self.program)
    
    def test_non_admin_cannot_register_student(self):
        """Test that non-admin users cannot register students."""
        # Create regular user
        regular_user = User.objects.create_user(
            email='regular@placemate.com',
            phone_number='1111111111',
            first_name='Regular',
            last_name='User',
            password='testpass123'
        )
        
        self.client.force_authenticate(user=regular_user)
        
        url = '/api/v1/students/register/'
        data = {
            'email': 'student2@placemate.com',
            'phone_number': '2222222222',
            'first_name': 'Student2',
            'last_name': 'User',
            'enrollment_number': 'CS2024002',
            'program': self.program.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_duplicate_enrollment_number_rejected(self):
        """Test that duplicate enrollment numbers are rejected."""
        # Create first student
        student_user = User.objects.create_user(
            email='student1@placemate.com',
            phone_number='1111111111',
            first_name='Student1',
            last_name='User',
            password='testpass123'
        )
        StudentProfile.objects.create(
            user=student_user,
            enrollment_number='CS2024001',
            program=self.program
        )
        
        url = '/api/v1/students/register/'
        data = {
            'email': 'student2@placemate.com',
            'phone_number': '2222222222',
            'first_name': 'Student2',
            'last_name': 'User',
            'enrollment_number': 'CS2024001',  # Same enrollment number
            'program': self.program.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('enrollment_number', response.data['errors'])


class StudentProfileTests(APITestCase):
    """
    Test cases for student profile management.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create student user
        self.student_user = User.objects.create_user(
            email='student@placemate.com',
            phone_number='1234567890',
            first_name='Test',
            last_name='Student',
            password='testpass123'
        )
        self.student_role = Role.objects.create(name='Student')
        self.student_user.roles.add(self.student_role)
        
        # Create student profile
        self.program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            enrollment_number='CS2024001',
            program=self.program
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.student_user)
    
    def test_student_can_view_own_profile(self):
        """Test that student can view their own profile."""
        url = '/api/v1/students/me/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success'], True)
        self.assertEqual(response.data['data']['enrollment_number'], 'CS2024001')
    
    def test_student_can_update_own_profile(self):
        """Test that student can update their own profile."""
        url = '/api/v1/students/me/'
        data = {
            'current_cgpa': '8.5',
            'tenth_percentage': '85.5',
            'address_line1': '123 College Street'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh profile from database
        self.student_profile.refresh_from_db()
        self.assertEqual(str(self.student_profile.current_cgpa), '8.50')
        self.assertEqual(str(self.student_profile.tenth_percentage), '85.50')
        self.assertEqual(self.student_profile.address_line1, '123 College Street')
    
    def test_student_cannot_update_readonly_fields(self):
        """Test that student cannot update read-only fields."""
        url = '/api/v1/students/me/'
        data = {
            'enrollment_number': 'NEW2024001',  # Read-only field
            'is_placed': True  # Read-only field
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh profile from database
        self.student_profile.refresh_from_db()
        # Fields should not be changed
        self.assertEqual(self.student_profile.enrollment_number, 'CS2024001')
        self.assertEqual(self.student_profile.is_placed, False)


class StudentManagementTests(APITestCase):
    """
    Test cases for administrative student management.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@placemate.com',
            phone_number='1234567890',
            first_name='Admin',
            last_name='User',
            password='testpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.admin_user.roles.add(self.admin_role)
        
        # Create student user
        self.student_user = User.objects.create_user(
            email='student@placemate.com',
            phone_number='1111111111',
            first_name='Test',
            last_name='Student',
            password='testpass123'
        )
        self.student_role = Role.objects.create(name='Student')
        self.student_user.roles.add(self.student_role)
        
        # Create student profile
        self.program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            enrollment_number='CS2024001',
            program=self.program
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_admin_can_list_all_students(self):
        """Test that admin can list all students."""
        url = '/api/v1/students/profiles/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['enrollment_number'], 'CS2024001')
    
    def test_admin_can_view_student_details(self):
        """Test that admin can view detailed student information."""
        url = f'/api/v1/students/profiles/{self.student_user.id}/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['enrollment_number'], 'CS2024001')
        self.assertIn('program_details', response.data['data'])
    
    def test_admin_can_mark_student_as_placed(self):
        """Test that admin can mark student as placed."""
        url = f'/api/v1/students/profiles/{self.student_user.id}/mark_as_placed/'
        data = {'is_placed': True}
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh profile from database
        self.student_profile.refresh_from_db()
        self.assertEqual(self.student_profile.is_placed, True)


class StudentDataIsolationTests(APITestCase):
    """
    Test cases for student data isolation and security.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create two students
        self.student1 = User.objects.create_user(
            email='student1@placemate.com',
            phone_number='1111111111',
            first_name='Student1',
            last_name='User',
            password='testpass123'
        )
        self.student2 = User.objects.create_user(
            email='student2@placemate.com',
            phone_number='2222222222',
            first_name='Student2',
            last_name='User',
            password='testpass123'
        )
        
        student_role = Role.objects.create(name='Student')
        self.student1.roles.add(student_role)
        self.student2.roles.add(student_role)
        
        # Create profiles
        program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG'
        )
        StudentProfile.objects.create(
            user=self.student1,
            enrollment_number='CS2024001',
            program=program
        )
        StudentProfile.objects.create(
            user=self.student2,
            enrollment_number='CS2024002',
            program=program
        )
    
    def test_student_cannot_access_other_student_profile(self):
        """Test that student cannot access another student's profile."""
        self.client.force_authenticate(user=self.student1)
        
        # Try to access student2's profile via admin endpoint
        url = f'/api/v1/students/profiles/{self.student2.id}/'
        
        response = self.client.get(url)
        
        # Should get 403 Forbidden since student1 doesn't have admin/placement role
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_student_can_only_access_own_profile_via_me(self):
        """Test that student can only access their own profile via /me/ endpoint."""
        self.client.force_authenticate(user=self.student1)
        
        url = '/api/v1/students/me/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['enrollment_number'], 'CS2024001')


class StudentPlacementTeamTests(APITestCase):
    """
    Test cases for placement team access to student data.
    """
    
    def setUp(self):
        """Set up test data."""
        # Create placement team user
        self.placement_user = User.objects.create_user(
            email='placement@placemate.com',
            phone_number='3333333333',
            first_name='Placement',
            last_name='Team',
            password='testpass123'
        )
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        self.placement_user.roles.add(self.placement_role)
        
        # Create student
        self.student_user = User.objects.create_user(
            email='student@placemate.com',
            phone_number='1111111111',
            first_name='Test',
            last_name='Student',
            password='testpass123'
        )
        student_role = Role.objects.create(name='Student')
        self.student_user.roles.add(student_role)
        
        # Create student profile
        program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            enrollment_number='CS2024001',
            program=program
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.placement_user)
    
    def test_placement_team_can_list_students(self):
        """Test that placement team can list all students."""
        url = '/api/v1/students/profiles/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['enrollment_number'], 'CS2024001')
    
    def test_placement_team_cannot_mark_placed(self):
        """Test that placement team cannot mark students as placed."""
        url = f'/api/v1/students/profiles/{self.student_user.id}/mark_as_placed/'
        data = {'is_placed': True}
        
        response = self.client.patch(url, data, format='json')
        
        # Placement team should get 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


if __name__ == '__main__':
    import django
    django.setup()
    import unittest
    unittest.main()