"""
TEST SUITE: Companies App - Views
Test Suite ID: COMPANIES-VIEWS-001

Tests for CompanyViewSet including CRUD operations and permissions.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.companies.models import Company
from apps.core.models import City, State, Country
from apps.users.models import Role
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CompanyViewSetTest(TestCase):
    """
    TEST SUITE: CompanyViewSet
    Test Suite ID: COMPANIES-VIEWS-001-001
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
        
        # Create regular authenticated user
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            phone_number='2222222222',
            first_name='Regular',
            last_name='User',
            password='userpass123'
        )
        student_role = Role.objects.create(name='Student')
        self.regular_user.roles.add(student_role)
        
        # Create location data
        self.country = Country.objects.create(name='India')
        self.state = State.objects.create(name='Maharashtra', country=self.country)
        self.city = City.objects.create(name='Mumbai', state=self.state)
        
        # Create test company
        self.company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890',
            website_url='https://testcompany.com'
        )
    
    def test_list_companies_authenticated(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-001
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify authenticated users can list companies
        """
        refresh = RefreshToken.for_user(self.regular_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('company-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
    
    def test_list_companies_unauthenticated(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-002
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify unauthenticated users cannot list companies
        """
        url = reverse('company-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_company_authenticated(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-003
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify authenticated users can retrieve company details
        """
        refresh = RefreshToken.for_user(self.regular_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('company-detail', kwargs={'pk': self.company.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['name'], 'Test Company')
    
    def test_create_company_admin_only(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-004
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify only admin can create companies
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {
            'name': 'New Company',
            'email': 'new@company.com',
            'phone_number': '9999999999',
            'website_url': 'https://newcompany.com'
        }
        
        url = reverse('company-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Company.objects.filter(name='New Company').exists())
    
    def test_create_company_non_admin_forbidden(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-005
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify non-admin users cannot create companies
        """
        refresh = RefreshToken.for_user(self.regular_user)
        refresh['active_role'] = 'Student'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {
            'name': 'New Company',
            'email': 'new@company.com',
            'phone_number': '9999999999'
        }
        
        url = reverse('company-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_company_admin_only(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-006
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify only admin can update companies
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        data = {'name': 'Updated Company Name'}
        
        url = reverse('company-detail', kwargs={'pk': self.company.id})
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.company.refresh_from_db()
        self.assertEqual(self.company.name, 'Updated Company Name')
    
    def test_delete_company_admin_only(self):
        """
        Test Case ID: COMPANIES-VIEWS-001-001-007
        Module: Companies App - CompanyViewSet
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify only admin can delete companies
        """
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['active_role'] = 'Admin'
        self.client.cookies['access_token'] = str(refresh.access_token)
        
        url = reverse('company-detail', kwargs={'pk': self.company.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Company.objects.filter(id=self.company.id).exists())

