"""
TEST SUITE: Users App - Permissions and Security
Test Suite ID: USERS-PERMISSIONS-001

Tests for custom permissions, role-based access control, and security validations.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import Role
from apps.core.permissions import IsAdminRole, IsPlacementTeam, IsStudentRole

User = get_user_model()


def set_access_cookie(client, user, role_name):
    refresh = RefreshToken.for_user(user)
    refresh['active_role'] = role_name
    client.cookies.clear()
    client.cookies['access_token'] = str(refresh.access_token)


class RoleBasedPermissionsTest(TestCase):
    """
    TEST SUITE: Role-Based Permissions
    Test Suite ID: USERS-PERMISSIONS-001-001
    """
    
    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create roles
        self.admin_role = Role.objects.create(name='Admin')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        self.student_role = Role.objects.create(name='Student')
        
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            phone_number='1111111111',
            first_name='Admin',
            last_name='User',
            password='adminpass123'
        )
        self.admin_user.roles.add(self.admin_role)
        
        self.placement_user = User.objects.create_user(
            email='placement@example.com',
            phone_number='2222222222',
            first_name='Placement',
            last_name='User',
            password='placementpass123'
        )
        self.placement_user.roles.add(self.placement_role)
        
        self.student_user = User.objects.create_user(
            email='student@example.com',
            phone_number='3333333333',
            first_name='Student',
            last_name='User',
            password='studentpass123'
        )
        self.student_user.roles.add(self.student_role)

    def _set_request_role(self, request, user, role_name):
        request.user = user
        request.auth = type('Token', (), {'payload': {'active_role': role_name}})()
    
    def test_admin_role_permission(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-001-001
        Test IsAdminRole permission allows only admin users
        """
        permission = IsAdminRole()
        request = self.factory.get('/')
        
        # Test with admin user
        self._set_request_role(request, self.admin_user, 'Admin')
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with placement user (active role mismatch)
        self._set_request_role(request, self.placement_user, 'Student Placement Cell')
        self.assertFalse(permission.has_permission(request, None))
        
        # Test with student user
        self._set_request_role(request, self.student_user, 'Student')
        self.assertFalse(permission.has_permission(request, None))
    
    def test_placement_team_permission(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-001-002
        Test IsPlacementTeam permission allows admin and placement users
        """
        permission = IsPlacementTeam()
        request = self.factory.get('/')
        
        self._set_request_role(request, self.admin_user, 'Admin')
        self.assertTrue(permission.has_permission(request, None))
        
        self._set_request_role(request, self.placement_user, 'Student Placement Cell')
        self.assertTrue(permission.has_permission(request, None))
        
        self._set_request_role(request, self.student_user, 'Student')
        self.assertFalse(permission.has_permission(request, None))
    
    def test_student_role_permission(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-001-003
        Test IsStudentRole permission allows only student users
        """
        permission = IsStudentRole()
        request = self.factory.get('/')
        
        self._set_request_role(request, self.student_user, 'Student')
        self.assertTrue(permission.has_permission(request, None))
        
        self._set_request_role(request, self.admin_user, 'Admin')
        self.assertFalse(permission.has_permission(request, None))
        
        self._set_request_role(request, self.placement_user, 'Student Placement Cell')
        self.assertFalse(permission.has_permission(request, None))


class SecurityValidationTest(TestCase):
    """
    TEST SUITE: Security Validations
    Test Suite ID: USERS-PERMISSIONS-001-002
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
        
        # Create another user for testing
        self.other_user = User.objects.create_user(
            email='other@example.com',
            phone_number='2222222222',
            first_name='Other',
            last_name='User',
            password='otherpass123'
        )
        self.other_user.roles.add(self.student_role)
        
        # Authenticate admin using cookie-based JWT
        set_access_cookie(self.client, self.admin_user, 'Admin')
    
    def test_cannot_modify_own_roles(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-002-001
        Test user cannot modify their own roles
        """
        response = self.client.patch(
            f'/api/v1/users/manage/{self.admin_user.id}/roles/',
            {'roles': [self.student_role.id]},
            format='json'
        )
        
        # Should either return 403 or not allow the operation
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])
    
    def test_cannot_deactivate_own_account(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-002-002
        Test user cannot deactivate their own account
        """
        response = self.client.patch(
            f'/api/v1/users/manage/{self.admin_user.id}/activation/',
            {'is_active': False},
            format='json'
        )
        
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])
    
    def test_cannot_delete_own_account(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-002-003
        Test user cannot delete their own account
        """
        response = self.client.delete(f'/api/v1/users/manage/{self.admin_user.id}/')
        
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])
    
    def test_admin_can_modify_other_users(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-002-004
        Test admin can modify other users' roles
        """
        response = self.client.patch(
            f'/api/v1/users/manage/{self.other_user.id}/roles/',
            {'roles': [self.student_role.id]},
            format='json'
        )
        
        # Should allow modification (200 or 204)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
    
    def test_admin_can_deactivate_other_users(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-002-005
        Test admin can deactivate other users
        """
        response = self.client.patch(
            f'/api/v1/users/manage/{self.other_user.id}/activation/',
            {'is_active': False},
            format='json'
        )
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])


class AuthenticationRequiredTest(TestCase):
    """
    TEST SUITE: Authentication Requirements
    Test Suite ID: USERS-PERMISSIONS-001-003
    """
    
    def setUp(self):
        self.client = APIClient()
        
        # Create a test user
        self.user = User.objects.create_user(
            email='test@example.com',
            phone_number='1234567890',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.role = Role.objects.create(name='Student')
        self.user.roles.add(self.role)
    
    def test_unauthenticated_access_to_protected_endpoints(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-003-001
        Test unauthenticated access to protected endpoints is denied
        """
        endpoints = [
            ('GET', '/api/v1/users/me/'),
            ('GET', '/api/v1/users/manage/'),
            ('POST', '/api/v1/logout/'),
        ]
        
        for method, endpoint in endpoints:
            if method == 'POST':
                response = self.client.post(endpoint)
            else:
                response = self.client.get(endpoint)
            
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_authenticated_access_to_profile(self):
        """
        Test Case ID: USERS-PERMISSIONS-001-003-002
        Test authenticated access to profile endpoint is allowed
        """
        set_access_cookie(self.client, self.user, 'Student')
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)