"""
TEST SUITE: Companies App - Models
Test Suite ID: COMPANIES-MODEL-001

Tests for Company model including validation and relationships.
"""
from django.test import TestCase
from apps.companies.models import Company
from apps.core.models import City, State, Country


class CompanyModelTest(TestCase):
    """
    TEST SUITE: Company Model
    Test Suite ID: COMPANIES-MODEL-001-001
    """
    
    def setUp(self):
        """Set up test data"""
        self.country = Country.objects.create(name='India')
        self.state = State.objects.create(name='Maharashtra', country=self.country)
        self.city = City.objects.create(name='Mumbai', state=self.state)
    
    def test_company_creation(self):
        """
        Test Case ID: COMPANIES-MODEL-001-001-001
        Module: Companies App - Company Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify Company can be created with valid data
        """
        company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890',
            website_url='https://testcompany.com',
            description='A test company',
            headquarters_city=self.city
        )
        
        self.assertEqual(company.name, 'Test Company')
        self.assertEqual(company.email, 'test@company.com')
        self.assertEqual(company.phone_number, '1234567890')
        self.assertIsNotNone(company.created_at)
        self.assertIsNotNone(company.updated_at)
    
    def test_company_name_uniqueness(self):
        """
        Test Case ID: COMPANIES-MODEL-001-001-002
        Module: Companies App - Company Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify company name must be unique
        """
        Company.objects.create(
            name='Unique Company',
            email='unique@company.com',
            phone_number='1111111111'
        )
        
        with self.assertRaises(Exception):
            Company.objects.create(
                name='Unique Company',  # Duplicate
                email='different@company.com',
                phone_number='2222222222'
            )
    
    def test_company_email_uniqueness(self):
        """
        Test Case ID: COMPANIES-MODEL-001-001-003
        Module: Companies App - Company Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify company email must be unique
        """
        Company.objects.create(
            name='Company One',
            email='test@company.com',
            phone_number='1111111111'
        )
        
        with self.assertRaises(Exception):
            Company.objects.create(
                name='Company Two',
                email='test@company.com',  # Duplicate
                phone_number='2222222222'
            )
    
    def test_company_size_choices(self):
        """
        Test Case ID: COMPANIES-MODEL-001-001-004
        Module: Companies App - Company Model
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify company size choices work correctly
        """
        company = Company.objects.create(
            name='Small Company',
            email='small@company.com',
            phone_number='1111111111',
            company_size=Company.CompanySize.RANGE_1_10
        )
        
        self.assertEqual(company.company_size, Company.CompanySize.RANGE_1_10)
        self.assertEqual(company.get_company_size_display(), '1–10 employees')
    
    def test_company_string_representation(self):
        """
        Test Case ID: COMPANIES-MODEL-001-001-005
        Module: Companies App - Company Model
        Test Type: Unit Test
        Priority: Low
        
        Objective: Verify string representation
        """
        company = Company.objects.create(
            name='Test Company',
            email='test@company.com',
            phone_number='1234567890'
        )
        
        self.assertEqual(str(company), 'Test Company')
    
    def test_company_ordering(self):
        """
        Test Case ID: COMPANIES-MODEL-001-001-006
        Module: Companies App - Company Model
        Test Type: Unit Test
        Priority: Low
        
        Objective: Verify companies are ordered by created_at descending
        """
        company1 = Company.objects.create(
            name='Company One',
            email='one@company.com',
            phone_number='1111111111'
        )
        
        company2 = Company.objects.create(
            name='Company Two',
            email='two@company.com',
            phone_number='2222222222'
        )
        
        companies = Company.objects.all()
        # Most recent first
        self.assertEqual(companies[0], company2)
        self.assertEqual(companies[1], company1)

