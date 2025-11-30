# apps/core/tests/test_models.py
"""
TEST SUITE: Core App - Data Models
Test Suite ID: CORE-MODEL-001

This suite tests all core data models that provide lookup data for the application.
Models tested: Country, State, City, Degree, Program
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.core.models import Country, State, City, Degree, Program

class CountryModelTest(TestCase):
    """
    TEST SUITE: Country Model
    Test Suite ID: CORE-MODEL-001-001
    """
    
    def test_country_creation(self):
        """
        Test Case ID: CORE-MODEL-001-001-001
        Module: Core App - Country Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify Country model can be created with valid data
        Preconditions: Database is properly migrated
        
        Test Steps:
        1. Create Country instance with name
        2. Save to database
        3. Verify instance properties
        
        Expected Results:
        - Country instance is created successfully
        - Name is stored correctly
        - String representation returns country name
        
        Test Data: name='United States'
        """
        country = Country.objects.create(name='United States')
        
        self.assertEqual(country.name, 'United States')
        self.assertEqual(str(country), 'United States')
    
    def test_country_name_uniqueness(self):
        """
        Test Case ID: CORE-MODEL-001-001-002
        Module: Core App - Country Model  
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify country names must be unique
        Preconditions: One country already exists in database
        
        Test Steps:
        1. Create first country with name 'Test Country'
        2. Attempt to create second country with same name
        3. Verify uniqueness constraint
        
        Expected Results:
        - First country creation succeeds
        - Second country creation raises IntegrityError
        """
        Country.objects.create(name='Test Country')
        
        with self.assertRaises(Exception):  # Should be IntegrityError
            Country.objects.create(name='Test Country')

class StateModelTest(TestCase):
    """
    TEST SUITE: State Model
    Test Suite ID: CORE-MODEL-001-002
    """
    
    def setUp(self):
        """Set up test data for state tests"""
        self.country = Country.objects.create(name='Test Country')
    
    def test_state_creation_with_country(self):
        """
        Test Case ID: CORE-MODEL-001-002-001
        Module: Core App - State Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify State model requires and links to Country
        Preconditions: Country instance exists
        
        Test Steps:
        1. Create State instance with name and country
        2. Save to database
        3. Verify relationships and properties
        
        Expected Results:
        - State instance is created successfully
        - Country relationship is established
        - String representation includes state and country names
        """
        state = State.objects.create(name='California', country=self.country)
        
        self.assertEqual(state.name, 'California')
        self.assertEqual(state.country, self.country)
        self.assertEqual(str(state), 'California, Test Country')

class ProgramModelTest(TestCase):
    """
    TEST SUITE: Program Model
    Test Suite ID: CORE-MODEL-001-003
    """
    
    def setUp(self):
        """Set up test data for program tests"""
        self.degree = Degree.objects.create(
            name='Bachelor of Science',
            abbreviation='B.Sc'
        )
    
    def test_program_creation(self):
        """
        Test Case ID: CORE-MODEL-001-003-001
        Module: Core App - Program Model
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify Program model creation with all fields
        Preconditions: Degree instance exists
        
        Test Steps:
        1. Create Program instance with all required fields
        2. Save to database
        3. Verify all properties including computed full_abbreviation
        
        Expected Results:
        - Program instance is created successfully
        - Degree relationship is established
        - full_abbreviation property combines degree and program abbreviations
        - String representation returns program name
        """
        program = Program.objects.create(
            name='Computer Science',
            abbreviation='CS',
            degree_level='UG',
            duration_years=4,
            degree=self.degree
        )
        
        self.assertEqual(program.name, 'Computer Science')
        self.assertEqual(program.degree, self.degree)
        self.assertEqual(program.full_abbreviation, 'B.Sc CS')
        self.assertEqual(str(program), 'Computer Science')
        self.assertTrue(program.is_active)  # Default value
    
    def test_program_degree_level_choices(self):
        """
        Test Case ID: CORE-MODEL-001-003-002
        Module: Core App - Program Model
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify program degree level uses valid choices
        Preconditions: Degree instance exists
        
        Test Steps:
        1. Create program with valid degree level
        2. Create program with invalid degree level
        3. Verify validation behavior
        
        Expected Results:
        - Valid degree levels are accepted
        - Invalid degree levels raise validation error
        """
        # Test valid choice
        program = Program(
            name='Test Program',
            abbreviation='TP',
            degree_level='UG',  # Valid choice
            duration_years=4,
            degree=self.degree
        )
        program.full_clean()  # Should not raise validation error
        
        # Test invalid choice
        program_invalid = Program(
            name='Invalid Program', 
            abbreviation='IP',
            degree_level='INVALID',  # Invalid choice
            duration_years=4,
            degree=self.degree
        )
        with self.assertRaises(ValidationError):
            program_invalid.full_clean()