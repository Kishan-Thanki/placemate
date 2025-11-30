# apps/core/tests/test_middleware.py
"""
TEST SUITE: Core App - Middleware
Test Suite ID: CORE-MIDDLEWARE-001

This suite tests the custom middleware that adds security headers to responses.
"""
from django.test import TestCase, RequestFactory
from django.http import HttpResponse
from apps.core.middleware import SecurityHeadersMiddleware

class SecurityHeadersMiddlewareTest(TestCase):
    """
    TEST SUITE: Security Headers Middleware
    Test Suite ID: CORE-MIDDLEWARE-001-001
    """
    
    def setUp(self):
        self.factory = RequestFactory()
        # Return HttpResponse instead of string
        self.get_response = lambda request: HttpResponse("Test Response")
        self.middleware = SecurityHeadersMiddleware(self.get_response)
    
    def test_security_headers_are_added(self):
        """
        Test Case ID: CORE-MIDDLEWARE-001-001-001
        Module: Core App - SecurityHeadersMiddleware
        Test Type: Unit Test
        Priority: Critical
        
        Objective: Verify all security headers are added to responses
        Preconditions: Middleware is properly initialized
        
        Test Steps:
        1. Create mock request
        2. Process through middleware
        3. Check all security headers are present in response
        
        Expected Results:
        - X-Content-Type-Options: nosniff
        - X-Frame-Options: DENY
        - X-XSS-Protection: 1; mode=block
        - Referrer-Policy: strict-origin-when-cross-origin
        - Permissions-Policy includes disabled features
        """
        request = self.factory.get('/')
        response = self.middleware(request)
        
        # Check standard security headers
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response['X-Frame-Options'], 'DENY')
        self.assertEqual(response['X-XSS-Protection'], '1; mode=block')
        
        # Check modern security headers
        self.assertEqual(response['Referrer-Policy'], 'strict-origin-when-cross-origin')
        self.assertIn('geolocation=()', response['Permissions-Policy'])
        self.assertIn('microphone=()', response['Permissions-Policy'])
        self.assertIn('camera=()', response['Permissions-Policy'])
    
    def test_middleware_preserves_original_response(self):
        """
        Test Case ID: CORE-MIDDLEWARE-001-001-002
        Module: Core App - SecurityHeadersMiddleware
        Test Type: Unit Test
        Priority: Medium
        
        Objective: Verify middleware doesn't modify response content
        Preconditions: Middleware is properly initialized
        
        Test Steps:
        1. Create mock request
        2. Process through middleware
        3. Verify response content is unchanged
        
        Expected Results:
        - Response content remains the same
        - Only headers are added, content is preserved
        """
        original_content = "Original Response Content"
        get_response = lambda request: HttpResponse(original_content)
        middleware = SecurityHeadersMiddleware(get_response)
        
        request = self.factory.get('/')
        response = middleware(request)
        
        self.assertEqual(response.content.decode(), original_content)