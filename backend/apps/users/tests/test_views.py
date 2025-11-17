"""
TEST SUITE: Users App - Views
Test Suite ID: USERS-VIEWS-001

Tests for all view classes including authentication, profile management, and admin operations.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.users.models import Role
from apps.core.permissions import IsAdminRole
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def authenticate_with_role(client, user, role_name):
    """Helper to set cookie-based JWT with active_role claim."""
    refresh = RefreshToken.for_user(user)
    refresh['active_role'] = role_name
    client.cookies.clear()
    client.cookies['access_token'] = str(refresh.access_token)


class AdminUserManagementTest(TestCase):
    """
    TEST SUITE: Admin User Management Views
    Test Suite ID: USERS-VIEWS-001-001
    """
    
    def setUp(self):
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.admin_user.roles.add(self.admin_role)
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='regular@example.com',
            phone_number='2222222222',
            first_name='Regular',
            last_name='User',
            password='regularpass123'
        )
        self.regular_user.roles.add(self.student_role)
        
        # Authenticate as admin via JWT cookie
        authenticate_with_role(self.client, self.admin_user, 'Admin')
    
    def test_user_registration_admin_success(self):
        """
        Test Case ID: USERS-VIEWS-001-001-001
        Test admin can register new users
        """
        data = {
            'email': 'newuser@example.com',
            'phone_number': '3333333333',
            'first_name': 'New',
            'last_name': 'User',
            'roles': [self.student_role.id]
        }
        
        with patch('apps.users.serializers.send_email_in_background') as mock_email:
            response = self.client.post('/api/v1/users/register/', data)
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
            mock_email.assert_called_once()
    
    def test_user_registration_non_admin_denied(self):
        """
        Test Case ID: USERS-VIEWS-001-001-002
        Test non-admin cannot register users
        """
        authenticate_with_role(self.client, self.regular_user, 'Student')
        
        data = {
            'email': 'newuser2@example.com',
            'phone_number': '4444444444',
            'first_name': 'New',
            'last_name': 'User',
            'roles': [self.student_role.id]
        }
        
        response = self.client.post('/api/v1/users/register/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_list_admin_access(self):
        """
        Test Case ID: USERS-VIEWS-001-001-003
        Test admin can list users
        """
        response = self.client.get('/api/v1/users/manage/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertGreaterEqual(len(response.data['data']), 2)
    
    def test_user_retrieve_admin_access(self):
        """
        Test Case ID: USERS-VIEWS-001-001-004
        Test admin can retrieve specific user
        """
        response = self.client.get(f'/api/v1/users/manage/{self.regular_user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['email'], 'regular@example.com')
    
    def test_user_role_update_admin(self):
        """
        Test Case ID: USERS-VIEWS-001-001-005
        Test admin can update user roles
        """
        placement_role = Role.objects.create(name='Student Placement Cell')
        
        response = self.client.patch(
            f'/api/v1/users/manage/{self.regular_user.id}/roles/',
            {'roles': [self.student_role.id, placement_role.id]}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.roles.count(), 2)
    
    def test_cannot_update_own_roles(self):
        """
        Test Case ID: USERS-VIEWS-001-001-006
        Test admin cannot update their own roles
        """
        response = self.client.patch(
            f'/api/v1/users/manage/{self.admin_user.id}/roles/',
            {'roles': [self.student_role.id]}
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Cannot modify own roles', str(response.data))
    
    def test_user_activation_deactivation(self):
        """
        Test Case ID: USERS-VIEWS-001-001-007
        Test admin can activate/deactivate users
        """
        # Deactivate user
        response = self.client.patch(
            f'/api/v1/users/manage/{self.regular_user.id}/activation/',
            {'is_active': False},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)
        
        # Reactivate user
        response = self.client.patch(
            f'/api/v1/users/manage/{self.regular_user.id}/activation/',
            {'is_active': True},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_active)
    
    def test_cannot_deactivate_own_account(self):
        """
        Test Case ID: USERS-VIEWS-001-001-008
        Test admin cannot deactivate their own account
        """
        response = self.client.patch(
            f'/api/v1/users/manage/{self.admin_user.id}/activation/',
            {'is_active': False},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Cannot deactivate own account', str(response.data))
    
    def test_user_deletion_admin(self):
        """
        Test Case ID: USERS-VIEWS-001-001-009
        Test admin can delete users
        """
        user_to_delete = User.objects.create_user(
            email='delete@example.com',
            phone_number='5555555555',
            first_name='Delete',
            last_name='User',
            password='deletepass123'
        )
        
        response = self.client.delete(f'/api/v1/users/manage/{user_to_delete.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(email='delete@example.com').exists())
    
    def test_cannot_delete_own_account(self):
        """
        Test Case ID: USERS-VIEWS-001-001-010
        Test admin cannot delete their own account
        """
        response = self.client.delete(f'/api/v1/users/manage/{self.admin_user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Cannot delete own account', str(response.data))


class ProfileManagementTest(TestCase):
    """
    TEST SUITE: Profile Management Views
    Test Suite ID: USERS-VIEWS-001-002
    """
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='profile@example.com',
            phone_number='1234567890',
            first_name='Profile',
            last_name='User',
            password='profilepass123'
        )
        self.student_role = Role.objects.create(name='Student')
        self.user.roles.add(self.student_role)
        
        authenticate_with_role(self.client, self.user, 'Student')
    
    def test_current_user_profile_retrieval(self):
        """
        Test Case ID: USERS-VIEWS-001-002-001
        Test authenticated user can retrieve their profile
        """
        response = self.client.get('/api/v1/users/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['email'], 'profile@example.com')
        self.assertEqual(response.data['data']['first_name'], 'Profile')
    
    def test_current_user_profile_update(self):
        """
        Test Case ID: USERS-VIEWS-001-002-002
        Test authenticated user can update their profile
        """
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'middle_name': 'Middle'
        }
        
        response = self.client.patch('/api/v1/users/me/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')
        self.assertEqual(self.user.middle_name, 'Middle')
    
    def test_profile_update_validation(self):
        """
        Test Case ID: USERS-VIEWS-001-002-003
        Test profile update validation
        """
        # Test with invalid data (empty first name)
        update_data = {
            'first_name': ''
        }
        
        response = self.client.patch('/api/v1/users/me/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('first_name', response.data.get('errors', {}))
    
    def test_unauthenticated_profile_access(self):
        """
        Test Case ID: USERS-VIEWS-001-002-004
        Test unauthenticated user cannot access profile
        """
        self.client.cookies.clear()
        
        response = self.client.get('/api/v1/users/me/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserFilteringTest(TestCase):
    """
    TEST SUITE: User Filtering
    Test Suite ID: USERS-VIEWS-001-003
    """
    
    def setUp(self):
        self.client = APIClient()
        
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.admin_user.roles.add(self.admin_role)
        
        # Create multiple users for filtering
        self.student1 = User.objects.create_user(
            email='student1@example.com',
            phone_number='2222222222',
            first_name='Student1',
            last_name='User',
            password='studentpass123'
        )
        self.student1.roles.add(self.student_role)
        
        self.student2 = User.objects.create_user(
            email='student2@example.com',
            phone_number='3333333333',
            first_name='Student2',
            last_name='User',
            password='studentpass123'
        )
        self.student2.roles.add(self.student_role)
        
        self.inactive_user = User.objects.create_user(
            email='inactive@example.com',
            phone_number='4444444444',
            first_name='Inactive',
            last_name='User',
            password='inactivepass123'
        )
        self.inactive_user.roles.add(self.student_role)
        self.inactive_user.is_active = False
        self.inactive_user.save()
        
        authenticate_with_role(self.client, self.admin_user, 'Admin')
    
    def test_filter_users_by_role(self):
        """
        Test Case ID: USERS-VIEWS-001-003-001
        Test filtering users by role ID
        """
        response = self.client.get(f'/api/v1/users/manage/?role_id={self.student_role.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return student1 and student2
        self.assertEqual(len(response.data['data']), 3)
    
    def test_filter_users_by_active_status(self):
        """
        Test Case ID: USERS-VIEWS-001-003-002
        Test filtering users by active status
        """
        response = self.client.get('/api/v1/users/manage/?is_active=false')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return only inactive user
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['email'], 'inactive@example.com')
    
    def test_filter_users_by_active_status_true(self):
        """
        Test Case ID: USERS-VIEWS-001-003-003
        Test filtering users by active=true
        """
        response = self.client.get('/api/v1/users/manage/?is_active=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return all active users (admin, student1, student2)
        self.assertEqual(len(response.data['data']), 3)