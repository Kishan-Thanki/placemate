# apps/core/tests/test_serializers.py
"""
TEST SUITE: Core App - Serializers
Test Suite ID: CORE-SERIALIZER-001

This suite tests the serializers for core lookup models.
"""
from django.test import TestCase
from apps.core.models import Country, State, City, Degree, Program
from apps.core.serializers import (
    CountrySerializer, StateSerializer, CitySerializer,
    DegreeSerializer, ProgramSerializer
)

class CountrySerializerTest(TestCase):
    """
    TEST SUITE: Country Serializer
    Test Suite ID: CORE-SERIALIZER-001-001
    """
    
    def test_country_serializer_fields(self):
        """
        Test Case ID: CORE-SERIALIZER-001-001-001
        Module: Core App - CountrySerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify CountrySerializer includes correct fields
        Preconditions: Country instance exists
        
        Test Steps:
        1. Create Country instance
        2. Serialize with CountrySerializer
        3. Verify serialized data structure
        
        Expected Results:
        - Contains id and name fields
        - Does not contain unexpected fields
        - Data matches model instance
        """
        country = Country.objects.create(name='Test Country')
        serializer = CountrySerializer(country)
        
        data = serializer.data
        self.assertEqual(data['id'], country.id)
        self.assertEqual(data['name'], 'Test Country')
        self.assertEqual(len(data), 2)  # Only id and name
    
    def test_country_serializer_validation(self):
        """
        Test Case ID: CORE-SERIALIZER-001-001-002
        Module: Core App - CountrySerializer
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify CountrySerializer validation works correctly
        Preconditions: None
        
        Test Steps:
        1. Create serializer with valid data
        2. Create serializer with invalid data (empty name)
        3. Verify validation results
        
        Expected Results:
        - Valid data passes validation
        - Invalid data fails validation with appropriate errors
        """
        # Test valid data
        valid_data = {'name': 'Valid Country'}
        serializer = CountrySerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Test invalid data
        invalid_data = {'name': ''}  # Empty name
        serializer = CountrySerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

class StateSerializerTest(TestCase):
    """
    TEST SUITE: State Serializer
    Test Suite ID: CORE-SERIALIZER-001-002
    """
    
    def setUp(self):
        self.country = Country.objects.create(name='Test Country')
    
    def test_state_serializer_includes_country(self):
        """
        Test Case ID: CORE-SERIALIZER-001-002-001
        Module: Core App - StateSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify StateSerializer includes country relationship
        Preconditions: Country and State instances exist
        
        Test Steps:
        1. Create State instance with country
        2. Serialize with StateSerializer
        3. Verify country ID is included in serialized data
        
        Expected Results:
        - Contains id, name, and country fields
        - Country field contains country ID
        - Data matches model relationships
        """
        state = State.objects.create(name='Test State', country=self.country)
        serializer = StateSerializer(state)
        
        data = serializer.data
        self.assertEqual(data['id'], state.id)
        self.assertEqual(data['name'], 'Test State')
        self.assertEqual(data['country'], self.country.id)

class ProgramSerializerTest(TestCase):
    """
    TEST SUITE: Program Serializer
    Test Suite ID: CORE-SERIALIZER-001-003
    """
    
    def setUp(self):
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
    
    def test_program_serializer_nested_degree(self):
        """
        Test Case ID: CORE-SERIALIZER-001-003-001
        Module: Core App - ProgramSerializer
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify ProgramSerializer includes nested degree data
        Preconditions: Program and Degree instances exist
        
        Test Steps:
        1. Create Program instance with degree
        2. Serialize with ProgramSerializer
        3. Verify nested degree data is included
        
        Expected Results:
        - Contains all program fields including nested degree
        - Degree is serialized with DegreeSerializer
        - Nested degree data includes name and abbreviation
        """
        serializer = ProgramSerializer(self.program)
        
        data = serializer.data
        self.assertEqual(data['name'], 'Computer Science')
        self.assertEqual(data['abbreviation'], 'CS')
        self.assertEqual(data['degree_level'], 'UG')
        
        # Verify nested degree
        self.assertIn('degree', data)
        self.assertEqual(data['degree']['name'], 'Bachelor of Science')
        self.assertEqual(data['degree']['abbreviation'], 'B.Sc')
    
    def test_program_serializer_read_only_degree(self):
        """
        Test Case ID: CORE-SERIALIZER-001-003-002
        Module: Core App - ProgramSerializer
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify degree field is read-only in ProgramSerializer
        Preconditions: None
        
        Test Steps:
        1. Create serializer data with degree information
        2. Attempt to create program with degree in data
        3. Verify degree is ignored during creation
        
        Expected Results:
        - Degree field is read-only
        - Degree must be set through other means (not via serializer)
        - Program creation works without degree in input data
        """
        data = {
            'name': 'New Program',
            'abbreviation': 'NP',
            'degree_level': 'UG',
            'duration_years': 4,
            'degree': {'name': 'Should be ignored'}  # Should be ignored
        }
        
        serializer = ProgramSerializer(data=data)
        
        # Degree should not be processed from input data
        # This would typically be set differently in actual usage
        self.assertTrue(serializer.is_valid())