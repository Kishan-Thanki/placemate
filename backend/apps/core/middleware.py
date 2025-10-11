"""
Custom Middleware for the Placemate Project.

This module contains custom middleware classes that are applied to every request-response cycle in the application. 
Middleware is used to implement project-wide, cross-cutting concerns like security headers.
"""

class SecurityHeadersMiddleware:
    """
    A middleware that adds important security headers to every HTTP response.

    This helps protect the application against common web vulnerabilities like cross-site scripting (XSS) and clickjacking. 
    It is registered in the `MIDDLEWARE` list in the project's settings.
    """
    def __init__(self, get_response):
        # This is boilerplate initialization for any middleware.
        self.get_response = get_response
    
    def __call__(self, request):
        # This method is called for every request.
        # It first gets the response that would be sent by the view.
        response = self.get_response(request)
        
        # --- Add security headers to the response before it's sent ---
        
        # Prevents the browser from interpreting files as a different MIME type.
        # This helps mitigate cross-site scripting (XSS) attacks.
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Prevents the site from being rendered within an <iframe> or <frame>.
        # This protects against "clickjacking" attacks.
        response['X-Frame-Options'] = 'DENY'
        
        # Enables the XSS protection filter built into most modern browsers.
        response['X-XSS-Protection'] = '1; mode=block'
        
        return response