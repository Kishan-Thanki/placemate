"""
TEST SUITE: Users App - Authentication Views
Test Suite ID: USERS-AUTH-001

Tests for login, logout, token refresh, and role selection functionality.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

LOGIN_URL = '/api/v1/token/'
REFRESH_URL = '/api/v1/token/refresh/'
LOGOUT_URL = '/api/v1/logout/'
ROLE_SELECT_URL = '/api/v1/auth/select-role/'

User = get_user_model()


class AuthenticationTest(TestCase):
    """
    TEST SUITE: Authentication Flow
    Test Suite ID: USERS-AUTH-001-001
    """
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'email': 'test@example.com',
            'phone_number': '1234567890',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'testpass123'
        }
        
        # Create roles
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        
        # Create test user
        self.user = User.objects.create_user(**self.user_data)
        self.user.roles.add(self.admin_role, self.student_role)
    
    def test_successful_login_with_single_role(self):
        """
        Test Case ID: USERS-AUTH-001-001-001
        Test successful login when user has only one role
        """
        # Create user with single role
        single_role_user = User.objects.create_user(
            email='single@example.com',
            phone_number='1111111111',
            first_name='Single',
            last_name='Role',
            password='testpass123'
        )
        single_role_user.roles.add(self.student_role)
        
        response = self.client.post(LOGIN_URL, {
            'email': 'single@example.com',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Tokens are in cookies, not response data
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['message'], 'Login successful')
        # For single role, requires_role_selection should not be in response
        self.assertNotIn('requires_role_selection', response.data['data'])
        self.assertIn('active_role', response.data['data'])
    
    def test_successful_login_with_multiple_roles(self):
        """
        Test Case ID: USERS-AUTH-001-001-002
        Test login when user has multiple roles (requires role selection)
        """
        response = self.client.post(LOGIN_URL, {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['requires_role_selection'])
        self.assertEqual(len(response.data['data']['available_roles']), 2)
        self.assertIn('Admin', response.data['data']['available_roles'])
        self.assertIn('Student', response.data['data']['available_roles'])
    
    def test_login_invalid_credentials(self):
        """
        Test Case ID: USERS-AUTH-001-001-003
        Test login with invalid credentials
        """
        response = self.client.post(LOGIN_URL, {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        
        # ValidationError is converted to ValidationErrorResponse (422) by exception handler
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        # Check error message - could be in message or errors field
        error_msg = str(response.data.get('message', '')) + ' ' + str(response.data.get('errors', ''))
        self.assertIn('Invalid credentials', error_msg)
    
    def test_login_inactive_user(self):
        """
        Test Case ID: USERS-AUTH-001-001-004
        Test login with inactive user account
        """
        self.user.is_active = False
        self.user.save()
        
        response = self.client.post(LOGIN_URL, {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        
        # ValidationError is converted to ValidationErrorResponse (422) by exception handler
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        # Check error message - could be in message or errors field
        error_msg = str(response.data.get('message', '')) + ' ' + str(response.data.get('errors', ''))
        self.assertIn('Account is disabled', error_msg)
    
    def test_login_no_roles_assigned(self):
        """
        Test Case ID: USERS-AUTH-001-001-005
        Test login when user has no roles assigned
        """
        no_role_user = User.objects.create_user(
            email='norole@example.com',
            phone_number='2222222222',
            first_name='No',
            last_name='Role',
            password='testpass123'
        )
        
        response = self.client.post(LOGIN_URL, {
            'email': 'norole@example.com',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('No roles assigned', str(response.data.get('message', '')))


class TokenManagementTest(TestCase):
    """
    TEST SUITE: Token Management
    Test Suite ID: USERS-AUTH-001-002
    """
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='token@example.com',
            phone_number='3333333333',
            first_name='Token',
            last_name='User',
            password='testpass123'
        )
        self.role = Role.objects.create(name='Admin')
        self.user.roles.add(self.role)
        
        # Login to get tokens in cookies
        login_response = self.client.post(LOGIN_URL, {
            'email': 'token@example.com',
            'password': 'testpass123'
        })
        self.refresh_token = login_response.cookies.get('refresh_token').value
    
    def test_token_refresh_success(self):
        """
        Test Case ID: USERS-AUTH-001-002-001
        Test successful token refresh
        """
        # Set refresh token cookie - APIClient uses SimpleCookie
        self.client.cookies['refresh_token'] = self.refresh_token
        
        response = self.client.post(REFRESH_URL)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # New access token should be in cookies
        self.assertIn('access_token', response.cookies)
    
    def test_token_refresh_no_token(self):
        """
        Test Case ID: USERS-AUTH-001-002-002
        Test token refresh without refresh token
        """
        self.client.cookies.clear()
        response = self.client.post(REFRESH_URL)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_logout_success(self):
        """
        Test Case ID: USERS-AUTH-001-002-003
        Test successful logout
        """
        # Login first to get tokens in cookies
        login_response = self.client.post(LOGIN_URL, {
            'email': 'token@example.com',
            'password': 'testpass123'
        })
        # Set cookies from login response - APIClient uses SimpleCookie
        access_token_value = login_response.cookies.get('access_token').value if login_response.cookies.get('access_token') else None
        refresh_token_value = login_response.cookies.get('refresh_token').value if login_response.cookies.get('refresh_token') else None
        if access_token_value:
            self.client.cookies['access_token'] = access_token_value
        if refresh_token_value:
            self.client.cookies['refresh_token'] = refresh_token_value
        
        response = self.client.post(LOGOUT_URL)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Logged out')
        # Cookies should be deleted
        self.assertEqual(response.cookies.get('access_token').value, '')
        self.assertEqual(response.cookies.get('refresh_token').value, '')


class RoleSelectionTest(TestCase):
    """
    TEST SUITE: Role Selection
    Test Suite ID: USERS-AUTH-001-003
    """
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='multirole@example.com',
            phone_number='4444444444',
            first_name='Multi',
            last_name='Role',
            password='testpass123'
        )
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.user.roles.add(self.admin_role, self.student_role)
        
        # Login first - will return requires_role_selection=True
        login_response = self.client.post(LOGIN_URL, {
            'email': 'multirole@example.com',
            'password': 'testpass123'
        })
        # For multi-role users, no tokens are set until role is selected
        self.user_id = login_response.data['data']['user_id']
    
    def test_role_selection_valid_role(self):
        """
        Test Case ID: USERS-AUTH-001-003-001
        Test valid role selection
        """
        response = self.client.post(ROLE_SELECT_URL, {
            'user_id': self.user_id,
            'role': 'Admin'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Tokens should be in cookies
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['data']['active_role'], 'Admin')
    
    def test_role_selection_invalid_role(self):
        """
        Test Case ID: USERS-AUTH-001-003-002
        Test role selection with invalid role
        """
        response = self.client.post(ROLE_SELECT_URL, {
            'user_id': self.user_id,
            'role': 'InvalidRole'
        })
        
        # ValidationError is converted to ValidationErrorResponse (422) by exception handler
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        # Check error in errors field (ValidationErrorResponse format)
        error_msg = str(response.data.get('errors', {})) + ' ' + str(response.data.get('message', ''))
        self.assertIn('not assigned to this user', error_msg)
    
    def test_role_selection_unauthorized(self):
        """
        Test Case ID: USERS-AUTH-001-003-003
        Test role selection without user_id (invalid request)
        """
        # Don't provide user_id
        response = self.client.post(ROLE_SELECT_URL, {
            'role': 'Admin'
        })
        
        # Should fail validation because user_id is required
        # ValidationError is converted to ValidationErrorResponse (422) by exception handler
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)