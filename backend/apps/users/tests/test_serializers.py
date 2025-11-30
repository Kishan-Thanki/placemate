"""
TEST SUITE: Users App - Serializers
Test Suite ID: USERS-SERIALIZER-001

Tests for all serializers including validation, data transformation, and business logic.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from rest_framework.exceptions import ValidationError
from apps.users.models import Role
from apps.users.serializers import (
    UserRegistrationSerializer,
    LoginUserSerializer,
    SelectRoleSerializer,
    UserSerializer,
    UserRoleUpdateSerializer,
    UserDetailSerializer,
    RoleSerializer,
    PermissionSerializer
)

User = get_user_model()


class UserRegistrationSerializerTest(TestCase):
    """
    TEST SUITE: User Registration Serializer
    Test Suite ID: USERS-SERIALIZER-001-001
    """
    
    def setUp(self):
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.valid_data = {
            'email': 'newuser@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'roles': [self.student_role.id]
        }
    
    def test_valid_registration_data(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-001
        Test serializer with valid registration data
        """
        serializer = UserRegistrationSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
    
    def test_registration_duplicate_email(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-002
        Test registration with duplicate email
        """
        User.objects.create_user(
            email='existing@example.com',
            phone_number='1111111111',
            first_name='Existing',
            last_name='User',
            password='testpass123'
        )
        
        data = self.valid_data.copy()
        data['email'] = 'existing@example.com'
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_registration_invalid_phone(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-003
        Test registration with invalid phone number
        """
        data = self.valid_data.copy()
        data['phone_number'] = 'invalid-phone'
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone_number', serializer.errors)
    
    def test_registration_missing_first_name(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-004
        Test registration with missing first name
        """
        data = self.valid_data.copy()
        data['first_name'] = ''
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('first_name', serializer.errors)
    
    def test_registration_no_roles(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-005
        Test registration with no roles assigned
        """
        data = self.valid_data.copy()
        data['roles'] = []
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('roles', serializer.errors)
    
    def test_registration_invalid_roles(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-006
        Test registration with invalid role IDs
        """
        data = self.valid_data.copy()
        data['roles'] = [999]  # Non-existent role ID
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('roles', serializer.errors)
    
    def test_user_creation_with_roles(self):
        """
        Test Case ID: USERS-SERIALIZER-001-001-008
        Test user creation with roles
        """
        serializer = UserRegistrationSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        
        user = serializer.save()
        
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertEqual(user.roles.count(), 1)
        self.assertEqual(user.roles.first().name, 'Student')


class LoginUserSerializerTest(TestCase):
    """
    TEST SUITE: Login User Serializer
    Test Suite ID: USERS-SERIALIZER-001-002
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            phone_number='1234567890',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.role = Role.objects.create(name='Student')
        self.user.roles.add(self.role)
    
    def test_valid_login_credentials(self):
        """
        Test Case ID: USERS-SERIALIZER-001-002-001
        Test serializer with valid login credentials
        """
        serializer = LoginUserSerializer(data={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
    
    def test_invalid_login_credentials(self):
        """
        Test Case ID: USERS-SERIALIZER-001-002-002
        Test serializer with invalid login credentials
        """
        serializer = LoginUserSerializer(data={
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_inactive_user_login(self):
        """
        Test Case ID: USERS-SERIALIZER-001-002-003
        Test login with inactive user
        """
        self.user.is_active = False
        self.user.save()
        
        serializer = LoginUserSerializer(data={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_missing_credentials(self):
        """
        Test Case ID: USERS-SERIALIZER-001-002-004
        Test login with missing credentials
        """
        serializer = LoginUserSerializer(data={
            'email': '',
            'password': ''
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        self.assertIn('password', serializer.errors)


class SelectRoleSerializerTest(TestCase):
    """
    TEST SUITE: Select Role Serializer
    Test Suite ID: USERS-SERIALIZER-001-003
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            phone_number='1234567890',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.user.roles.add(self.admin_role, self.student_role)
    
    def test_valid_role_selection(self):
        """
        Test Case ID: USERS-SERIALIZER-001-003-001
        Test valid role selection
        """
        serializer = SelectRoleSerializer(data={
            'user_id': self.user.id,
            'role': 'Admin'
        })
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
        self.assertEqual(serializer.validated_data['role'], 'Admin')
    
    def test_invalid_role_selection(self):
        """
        Test Case ID: USERS-SERIALIZER-001-003-002
        Test selection of role not assigned to user
        """
        serializer = SelectRoleSerializer(data={
            'user_id': self.user.id,
            'role': 'InvalidRole'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_nonexistent_user(self):
        """
        Test Case ID: USERS-SERIALIZER-001-003-003
        Test role selection for non-existent user
        """
        serializer = SelectRoleSerializer(data={
            'user_id': 9999,
            'role': 'Admin'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)


class UserSerializerTest(TestCase):
    """
    TEST SUITE: User Serializer
    Test Suite ID: USERS-SERIALIZER-001-004
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            phone_number='1234567890',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        self.role = Role.objects.create(name='Student')
        self.user.roles.add(self.role)
    
    def test_user_serialization(self):
        """
        Test Case ID: USERS-SERIALIZER-001-004-001
        Test user serialization
        """
        serializer = UserSerializer(self.user)
        
        data = serializer.data
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'John')
        self.assertEqual(data['last_name'], 'Doe')
        self.assertEqual(len(data['roles']), 1)
        self.assertEqual(data['roles'][0]['name'], 'Student')
    
    def test_user_update_validation(self):
        """
        Test Case ID: USERS-SERIALIZER-001-004-002
        Test user update validation
        """
        data = {
            'first_name': 'Jane',
            'last_name': 'Smith'
        }
        serializer = UserSerializer(self.user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_user = serializer.save()
        self.assertEqual(updated_user.first_name, 'Jane')
        self.assertEqual(updated_user.last_name, 'Smith')


class UserRoleUpdateSerializerTest(TestCase):
    """
    TEST SUITE: User Role Update Serializer
    Test Suite ID: USERS-SERIALIZER-001-005
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            phone_number='1234567890',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
    
    def test_valid_role_update(self):
        """
        Test Case ID: USERS-SERIALIZER-001-005-001
        Test valid role update
        """
        serializer = UserRoleUpdateSerializer(self.user, data={
            'roles': [self.admin_role.id, self.student_role.id]
        })
        self.assertTrue(serializer.is_valid())
        
        updated_user = serializer.save()
        self.assertEqual(updated_user.roles.count(), 2)
    
    def test_empty_roles_update(self):
        """
        Test Case ID: USERS-SERIALIZER-001-005-002
        Test update with empty roles
        """
        serializer = UserRoleUpdateSerializer(self.user, data={
            'roles': []
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('roles', serializer.errors)
    
    def test_invalid_roles_update(self):
        """
        Test Case ID: USERS-SERIALIZER-001-005-003
        Test update with invalid role IDs
        """
        serializer = UserRoleUpdateSerializer(self.user, data={
            'roles': [999]
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('roles', serializer.errors)


class RoleSerializerTest(TestCase):
    """
    TEST SUITE: Role Serializer
    Test Suite ID: USERS-SERIALIZER-001-006
    """
    
    def setUp(self):
        self.role = Role.objects.create(
            name='Test Role',
            description='A test role'
        )
        self.permission = Permission.objects.create(
            codename='test_permission',
            name='Test Permission',
            content_type_id=1
        )
        self.role.permissions.add(self.permission)
    
    def test_role_serialization(self):
        """
        Test Case ID: USERS-SERIALIZER-001-006-001
        Test role serialization with permissions
        """
        serializer = RoleSerializer(self.role)
        
        data = serializer.data
        self.assertEqual(data['name'], 'Test Role')
        self.assertEqual(data['description'], 'A test role')
        self.assertEqual(len(data['permissions']), 1)
        self.assertEqual(data['permissions'][0]['codename'], 'test_permission')
    
    def test_role_validation(self):
        """
        Test Case ID: USERS-SERIALIZER-001-006-002
        Test role validation
        """
        serializer = RoleSerializer(data={
            'name': 'New Role',
            'description': 'New role description'
        })
        self.assertTrue(serializer.is_valid())
        
        role = serializer.save()
        self.assertEqual(role.name, 'New Role')