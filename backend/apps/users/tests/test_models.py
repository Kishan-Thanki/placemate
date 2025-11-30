"""
TEST SUITE: Users App - Models
Test Suite ID: USERS-MODEL-001

Tests for User and Role models, including validation, relationships, and methods.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from apps.users.models import Role

User = get_user_model()


class UserModelTest(TestCase):
    """
    TEST SUITE: User Model
    Test Suite ID: USERS-MODEL-001-001
    """
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'testpass123'
        }
    
    def test_user_creation_with_required_fields(self):
        """
        Test Case ID: USERS-MODEL-001-001-001
        Test user creation with all required fields
        """
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.phone_number, '1234567890')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_user_email_uniqueness(self):
        """
        Test Case ID: USERS-MODEL-001-001-002
        Test email uniqueness constraint
        """
        User.objects.create_user(**self.user_data)
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='test@example.com',
                phone_number='0987654321',
                first_name='Jane',
                last_name='Doe',
                password='testpass123'
            )
    
    def test_user_phone_number_uniqueness(self):
        """
        Test Case ID: USERS-MODEL-001-001-003
        Test phone number uniqueness constraint
        """
        User.objects.create_user(**self.user_data)
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='different@example.com',
                phone_number='1234567890',
                first_name='Jane',
                last_name='Doe',
                password='testpass123'
            )
    
    def test_user_password_hashing(self):
        """
        Test Case ID: USERS-MODEL-001-001-004
        Test password is properly hashed
        """
        user = User.objects.create_user(**self.user_data)
        
        self.assertNotEqual(user.password, 'testpass123')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.check_password('wrongpassword'))
    
    def test_user_string_representation(self):
        """
        Test Case ID: USERS-MODEL-001-001-005
        Test user string representation
        """
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(str(user), 'test@example.com')
    
    def test_user_get_full_name(self):
        """
        Test Case ID: USERS-MODEL-001-001-006
        Test get_full_name method
        """
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.get_full_name(), 'John Doe')
        
        # Test with middle name
        user.middle_name = 'Middle'
        self.assertEqual(user.get_full_name(), 'John Middle Doe')
    
    def test_superuser_creation(self):
        """
        Test Case ID: USERS-MODEL-001-001-007
        Test superuser creation
        """
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            phone_number='1111111111',
            password='adminpass123'
        )
        
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)


class RoleModelTest(TestCase):
    """
    TEST SUITE: Role Model
    Test Suite ID: USERS-MODEL-001-002
    """
    
    def setUp(self):
        self.role_data = {
            'name': 'Test Role',
            'description': 'A test role for testing'
        }
    
    def test_role_creation(self):
        """
        Test Case ID: USERS-MODEL-001-002-001
        Test role creation
        """
        role = Role.objects.create(**self.role_data)
        
        self.assertEqual(role.name, 'Test Role')
        self.assertEqual(role.description, 'A test role for testing')
    
    def test_role_string_representation(self):
        """
        Test Case ID: USERS-MODEL-001-002-002
        Test role string representation
        """
        role = Role.objects.create(**self.role_data)
        
        self.assertEqual(str(role), 'Test Role')
    
    def test_role_permissions_relationship(self):
        """
        Test Case ID: USERS-MODEL-001-002-003
        Test role-permissions many-to-many relationship
        """
        role = Role.objects.create(**self.role_data)
        permission = Permission.objects.create(
            codename='test_permission',
            name='Test Permission',
            content_type_id=1  # Using default content type
        )
        
        role.permissions.add(permission)
        
        self.assertEqual(role.permissions.count(), 1)
        self.assertEqual(role.permissions.first(), permission)


class UserRoleRelationshipTest(TestCase):
    """
    TEST SUITE: User-Role Relationships
    Test Suite ID: USERS-MODEL-001-003
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            phone_number='1234567890',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
    
    def test_user_multiple_roles_assignment(self):
        """
        Test Case ID: USERS-MODEL-001-003-001
        Test assigning multiple roles to a user
        """
        self.user.roles.add(self.admin_role, self.student_role)
        
        self.assertEqual(self.user.roles.count(), 2)
        self.assertIn(self.admin_role, self.user.roles.all())
        self.assertIn(self.student_role, self.user.roles.all())
    
    def test_user_role_removal(self):
        """
        Test Case ID: USERS-MODEL-001-003-002
        Test removing roles from a user
        """
        self.user.roles.add(self.admin_role, self.student_role)
        self.user.roles.remove(self.student_role)
        
        self.assertEqual(self.user.roles.count(), 1)
        self.assertIn(self.admin_role, self.user.roles.all())
        self.assertNotIn(self.student_role, self.user.roles.all())
    
    def test_user_role_clear(self):
        """
        Test Case ID: USERS-MODEL-001-003-003
        Test clearing all roles from a user
        """
        self.user.roles.add(self.admin_role, self.student_role)
        self.user.roles.clear()
        
        self.assertEqual(self.user.roles.count(), 0)


class PasswordGenerationTest(TestCase):
    """
    TEST SUITE: Password Generation
    Test Suite ID: USERS-MODEL-001-004
    """
    
    def test_random_password_generation(self):
        """
        Test Case ID: USERS-MODEL-001-004-001
        Test random password generation
        """
        password = User.objects.make_random_password()
        
        self.assertEqual(len(password), 12)
        self.assertTrue(any(c.isupper() for c in password))
        self.assertTrue(any(c.islower() for c in password))
        self.assertTrue(any(c.isdigit() for c in password))
    
    def test_random_password_custom_length(self):
        """
        Test Case ID: USERS-MODEL-001-004-002
        Test random password generation with custom length
        """
        password = User.objects.make_random_password(length=16)
        
        self.assertEqual(len(password), 16)
    
    def test_random_password_without_symbols(self):
        """
        Test Case ID: USERS-MODEL-001-004-003
        Test random password generation without symbols
        """
        password = User.objects.make_random_password(include_symbols=False)
        
        self.assertFalse(any(c in "!@#$%^&*" for c in password))