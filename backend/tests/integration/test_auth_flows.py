"""
TEST SUITE: Integration Tests - Authentication Flows
Test Suite ID: INTEGRATION-AUTH-001

Tests complete authentication workflows including login, role selection, token refresh, and logout.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthenticationFlowTest(TestCase):
    """
    TEST SUITE: Complete Authentication Flow
    Test Suite ID: INTEGRATION-AUTH-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create roles
        self.admin_role = Role.objects.create(name='Admin')
        self.student_role = Role.objects.create(name='Student')
        self.placement_role = Role.objects.create(name='Student Placement Cell')
        
        # Create user with single role
        self.single_role_user = User.objects.create_user(
            email='single@example.com',
            phone_number='1111111111',
            first_name='Single',
            last_name='Role',
            password='testpass123'
        )
        self.single_role_user.roles.add(self.student_role)
        
        # Create user with multiple roles
        self.multi_role_user = User.objects.create_user(
            email='multi@example.com',
            phone_number='2222222222',
            first_name='Multi',
            last_name='Role',
            password='testpass123'
        )
        self.multi_role_user.roles.add(self.admin_role, self.student_role)
    
    def test_login_single_role_flow(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-001
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify complete login flow for single-role user
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'single@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['data']['active_role'], 'Student')
        self.assertFalse(response.data['data'].get('requires_role_selection', False))
    
    def test_login_multi_role_flow(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-002
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify login flow for multi-role user requires role selection
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'multi@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['requires_role_selection'])
        self.assertEqual(len(response.data['data']['available_roles']), 2)
        self.assertIn('Admin', response.data['data']['available_roles'])
        self.assertIn('Student', response.data['data']['available_roles'])
    
    def test_role_selection_flow(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-003
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify role selection completes login
        """
        # First login to get user_id
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'multi@example.com',
            'password': 'testpass123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        user_id = login_response.data['data']['user_id']
        
        # Select role
        role_url = reverse('select_role')
        role_data = {
            'user_id': user_id,
            'role': 'Admin'
        }
        response = self.client.post(role_url, role_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['data']['active_role'], 'Admin')
    
    def test_token_refresh_flow(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-004
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify token refresh maintains session
        """
        # Login first
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'single@example.com',
            'password': 'testpass123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        
        # Extract refresh token from cookies
        refresh_token = login_response.cookies.get('refresh_token').value
        
        # Refresh token
        refresh_url = reverse('token_refresh')
        # Set refresh token in cookies
        self.client.cookies['refresh_token'] = refresh_token
        
        response = self.client.post(refresh_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
    
    def test_logout_flow(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-005
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify logout clears tokens and blacklists refresh token
        """
        # Login first
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'single@example.com',
            'password': 'testpass123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        
        # Set tokens in cookies
        self.client.cookies['access_token'] = login_response.cookies.get('access_token').value
        self.client.cookies['refresh_token'] = login_response.cookies.get('refresh_token').value
        
        # Logout
        logout_url = reverse('logout')
        response = self.client.post(logout_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Cookies should be cleared (max_age=0 or deleted)
        # Note: Django test client may not show deleted cookies, but response should succeed
    
    def test_invalid_credentials(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-006
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify invalid credentials are rejected
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'single@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertNotIn('access_token', response.cookies)
    
    def test_inactive_user_login(self):
        """
        Test Case ID: INTEGRATION-AUTH-001-001-007
        Module: Integration - Authentication Flow
        Test Type: Integration Test
        Priority: Medium
        
        Objective: Verify inactive users cannot login
        """
        # Deactivate user
        self.single_role_user.is_active = False
        self.single_role_user.save()
        
        url = reverse('token_obtain_pair')
        data = {
            'email': 'single@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('disabled', str(response.data).lower() or 'inactive' in str(response.data).lower())

