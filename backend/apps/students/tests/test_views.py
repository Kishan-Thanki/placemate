"""
TEST SUITE: Students App - Views
Test Suite ID: STUDENTS-VIEWS-001

Tests for StudentProfile views including registration, profile management, and admin operations.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile
from apps.core.models import Program, Degree
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class StudentRegistrationViewTest(TestCase):
    """
    TEST SUITE: StudentRegistrationView
    Test Suite ID: STUDENTS-VIEWS-001-001
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
        
        # Create Student role
        Role.objects.create(name='Student')
        
        # Authenticate admin
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
    
    def test_student_registration_success(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-001-001
        Module: Students App - StudentRegistrationView
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can register new student
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
        
        url = reverse('student-register')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newstudent@example.com').exists())
        self.assertTrue(StudentProfile.objects.filter(enrollment_number='EN2024001').exists())
    
    def test_student_registration_requires_admin(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-001-002
        Module: Students App - StudentRegistrationView
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify only admin can register students
        """
        # Create non-admin user
        student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='2222222222',
            first_name='Student',
            last_name='User',
            password='studentpass123'
        )
        student_role = Role.objects.get(name='Student')
        student_user.roles.add(student_role)
        
        # Authenticate as student
        self.client.cookies.clear()
        refresh = RefreshToken.for_user(student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {
            'email': 'newstudent@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'enrollment_number': 'EN2024001',
            'program': self.program.id,
            'joining_year': 2024
        }
        
        url = reverse('student-register')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class StudentProfileViewTest(TestCase):
    """
    TEST SUITE: StudentProfileView
    Test Suite ID: STUDENTS-VIEWS-001-002
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create student user and profile
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='studentpass123'
        )
        student_role = Role.objects.create(name='Student')
        self.student_user.roles.add(student_role)
        
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
            user=self.student_user,
            program=self.program,
            enrollment_number='EN2024001',
            current_cgpa=8.5,
            joining_year=2024
        )
        
        # Authenticate student
        refresh = RefreshToken.for_user(self.student_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
    
    def test_get_student_profile(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-002-001
        Module: Students App - StudentProfileView
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify student can view own profile
        """
        url = reverse('current-student')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['enrollment_number'], 'EN2024001')
    
    def test_update_student_profile(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-002-002
        Module: Students App - StudentProfileView
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify student can update own profile
        """
        data = {
            'current_cgpa': '9.0',
            'tenth_percentage': '90.0'
        }
        
        url = reverse('current-student')
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_cgpa, 9.0)
    
    def test_student_cannot_update_read_only_fields(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-002-003
        Module: Students App - StudentProfileView
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify read-only fields cannot be updated
        """
        data = {
            'enrollment_number': 'EN2024999',  # Read-only
            'is_placed': True  # Read-only
        }
        
        url = reverse('current-student')
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        # Read-only fields should remain unchanged
        self.assertEqual(self.profile.enrollment_number, 'EN2024001')
        self.assertFalse(self.profile.is_placed)


class StudentViewSetTest(TestCase):
    """
    TEST SUITE: StudentViewSet
    Test Suite ID: STUDENTS-VIEWS-001-003
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
        
        # Create placement team user
        self.placement_user = User.objects.create_user(
            email='placement@example.com',
            phone_number='2222222222',
            first_name='Placement',
            last_name='Team',
            password='placementpass123'
        )
        placement_role = Role.objects.create(name='Student Placement Cell')
        self.placement_user.roles.add(placement_role)
        
        # Create students
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
        
        student_user1 = User.objects.create_user(
            email='student1@example.com',
            phone_number='3333333333',
            first_name='Student',
            last_name='One',
            password='studentpass123'
        )
        self.profile1 = StudentProfile.objects.create(
            user=student_user1,
            program=self.program,
            enrollment_number='EN2024001',
            is_placed=False,
            joining_year=2024
        )
        
        student_user2 = User.objects.create_user(
            email='student2@example.com',
            phone_number='4444444444',
            first_name='Student',
            last_name='Two',
            password='studentpass123'
        )
        self.profile2 = StudentProfile.objects.create(
            user=student_user2,
            program=self.program,
            enrollment_number='EN2024002',
            is_placed=True,
            joining_year=2024
        )
    
    def test_list_students_as_admin(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-003-001
        Module: Students App - StudentViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can list all students
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('student-profiles-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)
    
    def test_list_students_as_placement_team(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-003-002
        Module: Students App - StudentViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify placement team can list students
        """
        refresh = RefreshToken.for_user(self.placement_user)
        refresh['active_role'] = 'Student Placement Cell'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('student-profiles-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)
    
    def test_filter_students_by_placement_status(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-003-003
        Module: Students App - StudentViewSet
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify filtering students by placement status
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('student-profiles-list')
        response = self.client.get(url, {'is_placed': 'true'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['is_placed'], True)
    
    def test_retrieve_student_detail(self):
        """
        Test Case ID: STUDENTS-VIEWS-001-003-004
        Module: Students App - StudentViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify admin can retrieve student details
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('student-profiles-detail', kwargs={'pk': self.profile1.user_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['enrollment_number'], 'EN2024001')

