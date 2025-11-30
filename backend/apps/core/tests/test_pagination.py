# apps/core/tests/test_pagination.py
"""
TEST SUITE: Core App - Pagination
Test Suite ID: CORE-PAGINATION-001

This suite tests the custom pagination class that integrates with our 
standardized API response format.
"""
from django.test import TestCase, RequestFactory
from rest_framework.request import Request
from apps.core.pagination import StandardPagination

class StandardPaginationTest(TestCase):
    """
    TEST SUITE: Standard Pagination Class
    Test Suite ID: CORE-PAGINATION-001-001
    """
    
    def setUp(self):
        self.factory = RequestFactory()
        self.pagination = StandardPagination()
    
    def test_pagination_defaults(self):
        """
        Test Case ID: CORE-PAGINATION-001-001-001
        Module: Core App - StandardPagination
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify pagination class has correct default values
        Preconditions: StandardPagination class is properly defined
        
        Test Steps:
        1. Create StandardPagination instance
        2. Check default page size
        3. Verify query parameter names
        
        Expected Results:
        - page_size is 20
        - page_size_query_param is 'page_size'
        - max_page_size is 100
        """
        self.assertEqual(self.pagination.page_size, 20)
        self.assertEqual(self.pagination.page_size_query_param, 'page_size')
        self.assertEqual(self.pagination.max_page_size, 100)
    
    def test_pagination_response_structure(self):
        """
        Test Case ID: CORE-PAGINATION-001-001-002
        Module: Core App - StandardPagination
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify paginated response uses our standard format
        Preconditions: Mock data and pagination setup
        
        Test Steps:
        1. Create mock data and pagination setup
        2. Call get_paginated_response
        3. Verify response structure matches PaginatedResponse format
        
        Expected Results:
        - Response uses PaginatedResponse class
        - Contains success, message, data, and pagination fields
        - Pagination metadata includes all required fields
        """
        # Mock pagination setup
        self.pagination.page = type('Page', (), {
            'paginator': type('Paginator', (), {
                'count': 100,
                'num_pages': 5
            })(),
            'number': 2
        })()
        
        # Mock request for page size calculation
        request = self.factory.get('/test/?page_size=25')
        self.pagination.request = Request(request)
        
        test_data = [{'id': 1, 'name': 'Item 1'}, {'id': 2, 'name': 'Item 2'}]
        
        # Mock get_next_link and get_previous_link
        self.pagination.get_next_link = lambda: 'http://test.com/?page=3'
        self.pagination.get_previous_link = lambda: 'http://test.com/?page=1'
        self.pagination.get_page_size = lambda request: 25
        
        response = self.pagination.get_paginated_response(test_data)
        
        # Verify response structure
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], "Data retrieved successfully")
        self.assertEqual(response.data['data'], test_data)
        
        # Verify pagination structure
        pagination_data = response.data['pagination']
        self.assertEqual(pagination_data['count'], 100)
        self.assertEqual(pagination_data['next'], 'http://test.com/?page=3')
        self.assertEqual(pagination_data['previous'], 'http://test.com/?page=1')
        self.assertEqual(pagination_data['current_page'], 2)
        self.assertEqual(pagination_data['total_pages'], 5)
        self.assertEqual(pagination_data['page_size'], 25)
    
    def test_pagination_schema_generation(self):
        """
        Test Case ID: CORE-PAGINATION-001-001-003
        Module: Core App - StandardPagination
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify pagination schema is correctly generated for API docs
        Preconditions: None
        
        Test Steps:
        1. Call get_paginated_response_schema with test schema
        2. Verify generated OpenAPI schema structure
        
        Expected Results:
        - Schema includes all required properties
        - Pagination object has correct structure
        - Data property uses provided schema
        """
        test_schema = {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'name': {'type': 'string'}
                }
            }
        }
        
        schema = self.pagination.get_paginated_response_schema(test_schema)
        
        # Verify top-level structure
        self.assertEqual(schema['type'], 'object')
        self.assertIn('properties', schema)
        
        # Verify success field
        self.assertEqual(schema['properties']['success']['type'], 'boolean')
        
        # Verify data field uses provided schema
        self.assertEqual(schema['properties']['data'], test_schema)
        
        # Verify pagination structure
        pagination_props = schema['properties']['pagination']['properties']
        self.assertEqual(pagination_props['count']['type'], 'integer')
        self.assertEqual(pagination_props['next']['type'], 'string')
        self.assertEqual(pagination_props['previous']['type'], 'string')
        self.assertEqual(pagination_props['current_page']['type'], 'integer')