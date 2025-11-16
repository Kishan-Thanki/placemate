# apps/core/tests/test_views.py
"""
TEST SUITE: Core App - Views
Test Suite ID: CORE-VIEWS-001

This suite tests the core view classes including BaseViewSet and LookupAPI.
"""
from django.test import TestCase
from unittest.mock import Mock, patch
from rest_framework.test import APIRequestFactory
from rest_framework import status
from apps.core.views import BaseViewSet, LookupAPI
from apps.core.models import Country, State, Degree, Program
from apps.core.serializers import CountrySerializer

class BaseViewSetTest(TestCase):
    """
    TEST SUITE: Base ViewSet
    Test Suite ID: CORE-VIEWS-001-001
    """
    
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create a concrete ViewSet for testing BaseViewSet functionality
        class TestViewSet(BaseViewSet):
            queryset = Country.objects.all()
            serializer_class = CountrySerializer
        
        self.viewset = TestViewSet()
    
    @patch('apps.core.views.SuccessResponse')
    def test_list_action_success(self, mock_success_response):
        """
        Test Case ID: CORE-VIEWS-001-001-001
        Module: Core App - BaseViewSet List Action
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify list action returns standardized success response
        Preconditions: Mock data and queryset
        
        Test Steps:
        1. Mock queryset and serializer
        2. Call list action
        3. Verify SuccessResponse is used
        
        Expected Results:
        - Uses SuccessResponse for non-paginated data
        - Includes correct message
        - Handles exceptions properly
        """
        # Mock the viewset components
        self.viewset.filter_queryset = Mock(return_value=Country.objects.all())
        self.viewset.get_queryset = Mock(return_value=Country.objects.all())
        self.viewset.paginate_queryset = Mock(return_value=None)  # No pagination
        self.viewset.get_serializer = Mock()
        self.viewset.get_serializer.return_value.data = [{'id': 1, 'name': 'Test'}]
        
        request = self.factory.get('/countries/')
        self.viewset.request = request
        
        # Mock SuccessResponse to capture call
        mock_response_instance = Mock()
        mock_success_response.return_value = mock_response_instance
        
        response = self.viewset.list(request)
        
        # Verify SuccessResponse was called with correct data
        mock_success_response.assert_called_once_with(
            data=[{'id': 1, 'name': 'Test'}],
            message="Data retrieved successfully"
        )
        self.assertEqual(response, mock_response_instance)
    
    @patch('apps.core.views.NotFoundResponse')
    def test_retrieve_action_not_found(self, mock_not_found_response):
        """
        Test Case ID: CORE-VIEWS-001-001-002
        Module: Core App - BaseViewSet Retrieve Action
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify retrieve action handles not found gracefully
        Preconditions: Object does not exist
        
        Test Steps:
        1. Mock get_object to raise DoesNotExist
        2. Call retrieve action
        3. Verify NotFoundResponse is returned
        
        Expected Results:
        - Returns NotFoundResponse when object doesn't exist
        - Handles exceptions in standardized format
        """
        self.viewset.get_object = Mock(side_effect=Country.DoesNotExist)
        
        request = self.factory.get('/countries/1/')
        self.viewset.request = request
        
        # Mock NotFoundResponse
        mock_response_instance = Mock()
        mock_not_found_response.return_value = mock_response_instance
        
        response = self.viewset.retrieve(request, pk=1)
        
        mock_not_found_response.assert_called_once()
        self.assertEqual(response, mock_response_instance)

class LookupAPITest(TestCase):
    """
    TEST SUITE: Lookup API View
    Test Suite ID: CORE-VIEWS-001-002
    """
    
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = LookupAPI()
        
        # Create test data
        self.country = Country.objects.create(name='Test Country')
        self.state = State.objects.create(name='Test State', country=self.country)
        self.degree = Degree.objects.create(name='Test Degree', abbreviation='TD')
        self.program = Program.objects.create(
            name='Test Program',
            abbreviation='TP',
            degree_level='UG',
            duration_years=4,
            degree=self.degree
        )
    
    def test_countries_lookup(self):
        """
        Test Case ID: CORE-VIEWS-001-002-001
        Module: Core App - LookupAPI Countries
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify countries lookup returns all countries
        Preconditions: Country data exists in database
        
        Test Steps:
        1. Create GET request for countries lookup
        2. Call LookupAPI get method
        3. Verify response contains countries data
        
        Expected Results:
        - Returns SuccessResponse with countries data
        - Countries are ordered by name
        - Response message indicates success
        """
        request = self.factory.get('/core/lookup/?type=countries')
        response = self.view.get(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], "Countries retrieved successfully")
        
        data = response.data['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Test Country')
    
    def test_states_lookup_with_parent(self):
        """
        Test Case ID: CORE-VIEWS-001-002-002
        Module: Core App - LookupAPI States with Parent
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify states lookup filtered by country
        Preconditions: Country and State data exists
        
        Test Steps:
        1. Create GET request for states with country filter
        2. Call LookupAPI get method
        3. Verify response contains filtered states
        
        Expected Results:
        - Returns only states for specified country
        - Response message includes parent context
        - States are ordered by name
        """
        # Create another state in different country
        other_country = Country.objects.create(name='Other Country')
        State.objects.create(name='Other State', country=other_country)
        
        request = self.factory.get(f'/core/lookup/?type=states&parent_id={self.country.id}')
        response = self.view.get(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn(f"States for country {self.country.id}", response.data['message'])
        
        data = response.data['data']
        self.assertEqual(len(data), 1)  # Only one state for this country
        self.assertEqual(data[0]['name'], 'Test State')
    
    def test_programs_lookup_active_only(self):
        """
        Test Case ID: CORE-VIEWS-001-002-003
        Module: Core App - LookupAPI Programs
        Test Type: Integration Test
        Priority: High
        
        Objective: Verify programs lookup returns only active programs
        Preconditions: Active and inactive programs exist
        
        Test Steps:
        1. Create inactive program
        2. Request programs lookup
        3. Verify only active programs returned
        
        Expected Results:
        - Returns only programs with is_active=True
        - Programs are ordered by name
        - Includes nested degree data
        """
        # Create inactive program
        Program.objects.create(
            name='Inactive Program',
            abbreviation='IP',
            degree_level='UG',
            duration_years=4,
            degree=self.degree,
            is_active=False
        )
        
        request = self.factory.get('/core/lookup/?type=programs')
        response = self.view.get(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data['data']
        self.assertEqual(len(data), 1)  # Only active program
        self.assertEqual(data[0]['name'], 'Test Program')
        
        # Verify nested degree data
        self.assertIn('degree', data[0])
        self.assertEqual(data[0]['degree']['name'], 'Test Degree')
    
    def test_invalid_lookup_type(self):
        """
        Test Case ID: CORE-VIEWS-001-002-004
        Module: Core App - LookupAPI Error Handling
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify invalid lookup type returns error response
        Preconditions: None
        
        Test Steps:
        1. Create GET request with invalid type parameter
        2. Call LookupAPI get method
        3. Verify error response
        
        Expected Results:
        - Returns ErrorResponse with appropriate message
        - Status code indicates client error
        - Message explains valid types
        """
        request = self.factory.get('/core/lookup/?type=invalid')
        response = self.view.get(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('Invalid type parameter', response.data['message'])
        self.assertIn('countries, states, cities, degrees, programs', response.data['message'])