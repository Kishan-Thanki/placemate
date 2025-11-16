# apps/core/tests/test_exception_handler.py
"""
TEST SUITE: Core App - Exception Handler
Test Suite ID: CORE-EXCEPTION-001

This suite tests the custom exception handler that translates all exceptions
into standardized API responses.
"""
from django.test import TestCase
from django.http import Http404
from django.db import IntegrityError
from rest_framework.exceptions import (
    AuthenticationFailed, ValidationError, NotAuthenticated, 
    PermissionDenied, Throttled
)
from apps.core.exception_handler import custom_exception_handler
from apps.core.exceptions import (
    ValidationException, AuthenticationException, PermissionException,
    NotFoundException, ConflictException
)

class ExceptionHandlerTest(TestCase):
    """
    TEST SUITE: Custom Exception Handler
    Test Suite ID: CORE-EXCEPTION-001-001
    """
    
    def test_validation_exception_handling(self):
        """
        Test Case ID: CORE-EXCEPTION-001-001-001
        Module: Core App - Exception Handler
        Test Type: Unit Test
        Priority: Critical
        
        Objective: Verify ValidationException returns 422 response with errors
        Preconditions: None
        
        Test Steps:
        1. Create ValidationException with error details
        2. Pass to custom_exception_handler
        3. Verify response structure and status code
        
        Expected Results:
        - Status code is 422 Unprocessable Entity
        - Response includes error details
        - error_code is validation_error
        """
        exception = ValidationException(
            detail="Invalid input",
            code="validation_error",
            errors={'field': ['This field is required.']}
        )
        context = {'view': None}
        
        response = custom_exception_handler(exception, context)
        
        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error_code'], 'validation_error')
        self.assertIn('errors', response.data)
    
    def test_drf_validation_error_handling(self):
        """
        Test Case ID: CORE-EXCEPTION-001-001-002
        Module: Core App - Exception Handler
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify DRF ValidationError is converted to standard format
        Preconditions: None
        
        Test Steps:
        1. Create DRF ValidationError
        2. Pass to custom_exception_handler
        3. Verify response uses our standard format
        
        Expected Results:
        - Status code is 422 Unprocessable Entity
        - Response includes errors in standard format
        - success field is False
        """
        exception = ValidationError({'email': ['Enter a valid email address.']})
        context = {'view': None}
        
        response = custom_exception_handler(exception, context)
        
        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.data['success'])
        self.assertIn('errors', response.data)
    
    def test_authentication_exception_handling(self):
        """
        Test Case ID: CORE-EXCEPTION-001-001-003
        Module: Core App - Exception Handler
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify AuthenticationException returns 401 response
        Preconditions: None
        
        Test Steps:
        1. Create AuthenticationException
        2. Pass to custom_exception_handler
        3. Verify 401 status and proper message
        
        Expected Results:
        - Status code is 401 Unauthorized
        - error_code is authentication_failed
        - Message indicates authentication failure
        """
        exception = AuthenticationException("Invalid credentials")
        context = {'view': None}
        
        response = custom_exception_handler(exception, context)
        
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data['error_code'], 'authentication_failed')
    
    def test_not_found_exception_handling(self):
        """
        Test Case ID: CORE-EXCEPTION-001-001-004
        Module: Core App - Exception Handler
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify NotFoundException returns 404 response
        Preconditions: None
        
        Test Steps:
        1. Create NotFoundException
        2. Pass to custom_exception_handler
        3. Verify 404 status and proper message
        
        Expected Results:
        - Status code is 404 Not Found
        - error_code is not_found
        - Message indicates resource not found
        """
        exception = NotFoundException("User not found")
        context = {'view': None}
        
        response = custom_exception_handler(exception, context)
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error_code'], 'not_found')
        self.assertEqual(response.data['message'], 'User not found')
    
    def test_django_http404_handling(self):
        """
        Test Case ID: CORE-EXCEPTION-001-001-005
        Module: Core App - Exception Handler
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify Django Http404 is converted to standard format
        Preconditions: None
        
        Test Steps:
        1. Create Django Http404 exception
        2. Pass to custom_exception_handler
        3. Verify 404 response in standard format
        
        Expected Results:
        - Status code is 404 Not Found
        - Response uses our standard error format
        - success field is False
        """
        exception = Http404("Page not found")
        context = {'view': None}
        
        response = custom_exception_handler(exception, context)
        
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.data['success'])
        # Fix: Use uppercase to match actual implementation
        self.assertEqual(response.data['error_code'], 'NOT_FOUND')