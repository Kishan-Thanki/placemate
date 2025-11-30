# apps/core/tests/test_response.py
"""
TEST SUITE: Core App - Response Classes
Test Suite ID: CORE-RESPONSE-001

This suite tests all custom API response classes to ensure they format
data according to the Placemate API standard.
"""
from django.test import TestCase
from rest_framework import status
from apps.core.response import (
    SuccessResponse, CreatedResponse, DeleteSuccessResponse,
    PaginatedResponse, ValidationErrorResponse, NotFoundResponse,
    UnauthorizedResponse, ForbiddenResponse, ConflictResponse, ServerErrorResponse
)

class SuccessResponseTest(TestCase):
    """
    TEST SUITE: Success Response Classes
    Test Suite ID: CORE-RESPONSE-001-001
    """
    
    def test_success_response_structure(self):
        """
        Test Case ID: CORE-RESPONSE-001-001-001
        Module: Core App - SuccessResponse
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify SuccessResponse creates correct JSON structure
        Preconditions: None
        
        Test Steps:
        1. Create SuccessResponse with test data
        2. Check response status code
        3. Verify response data structure
        
        Expected Results:
        - Status code is 200 OK
        - success field is True
        - message is provided message
        - data contains provided data
        - timestamp is present and valid
        """
        test_data = {'id': 1, 'name': 'Test'}
        response = SuccessResponse(data=test_data, message="Test successful")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.data
        self.assertTrue(response_data['success'])
        self.assertEqual(response_data['message'], "Test successful")
        self.assertEqual(response_data['data'], test_data)
        self.assertIn('timestamp', response_data)
    
    def test_created_response(self):
        """
        Test Case ID: CORE-RESPONSE-001-001-002
        Module: Core App - CreatedResponse
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify CreatedResponse uses 201 status code
        Preconditions: None
        
        Test Steps:
        1. Create CreatedResponse with test data
        2. Check response status code is 201
        
        Expected Results:
        - Status code is 201 CREATED
        - success field is True
        - message indicates resource creation
        """
        response = CreatedResponse(data={'id': 1})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], "Resource created successfully")

class ErrorResponseTest(TestCase):
    """
    TEST SUITE: Error Response Classes
    Test Suite ID: CORE-RESPONSE-001-002
    """
    
    def test_validation_error_response(self):
        """
        Test Case ID: CORE-RESPONSE-001-002-001
        Module: Core App - ValidationErrorResponse
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify ValidationErrorResponse includes error details
        Preconditions: None
        
        Test Steps:
        1. Create ValidationErrorResponse with error details
        2. Check response status code and structure
        
        Expected Results:
        - Status code is 422 Unprocessable Entity
        - success field is False
        - errors field contains validation errors
        - error_code is VALIDATION_ERROR
        """
        test_errors = {'email': ['Enter a valid email address.']}
        response = ValidationErrorResponse(errors=test_errors)
        
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['errors'], test_errors)
        self.assertEqual(response.data['error_code'], 'VALIDATION_ERROR')
    
    def test_not_found_response(self):
        """
        Test Case ID: CORE-RESPONSE-001-002-002
        Module: Core App - NotFoundResponse
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify NotFoundResponse uses 404 status with proper message
        Preconditions: None
        
        Test Steps:
        1. Create NotFoundResponse with custom message
        2. Verify status code and error details
        
        Expected Results:
        - Status code is 404 Not Found
        - success field is False
        - error_code is NOT_FOUND
        - Custom message is used if provided
        """
        response = NotFoundResponse(message="User not found")
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], "User not found")
        self.assertEqual(response.data['error_code'], 'NOT_FOUND')

class PaginatedResponseTest(TestCase):
    """
    TEST SUITE: Paginated Response
    Test Suite ID: CORE-RESPONSE-001-003
    """
    
    def test_paginated_response_structure(self):
        """
        Test Case ID: CORE-RESPONSE-001-003-001
        Module: Core App - PaginatedResponse
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify PaginatedResponse includes pagination metadata
        Preconditions: None
        
        Test Steps:
        1. Create PaginatedResponse with data and pagination info
        2. Verify response includes pagination object
        3. Check all pagination fields are present
        
        Expected Results:
        - success field is True
        - data contains the paginated items
        - pagination object includes count, next, previous, etc.
        - message indicates successful retrieval
        """
        test_data = [{'id': 1, 'name': 'Item 1'}, {'id': 2, 'name': 'Item 2'}]
        pagination_data = {
            'count': 100,
            'next': 'http://api.example.com/items?page=2',
            'previous': None,
            'current_page': 1,
            'total_pages': 5,
            'page_size': 20
        }
        
        response = PaginatedResponse(
            data=test_data, 
            pagination_data=pagination_data,
            message="Items retrieved"
        )
        
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data'], test_data)
        self.assertEqual(response.data['pagination'], pagination_data)
        self.assertEqual(response.data['message'], "Items retrieved")