"""
Custom Middleware for the Placemate Project.

This module contains custom middleware classes that are applied to every request-response cycle in the application. 
Middleware is used to implement project-wide, cross-cutting concerns like security headers.
"""

class SecurityHeadersMiddleware:
    """
    A middleware that adds important security headers to every HTTP response.

    This helps protect the application against common web vulnerabilities like
    cross-site scripting (XSS), clickjacking, and browser feature sniffing.
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # --- Standard Security Headers ---
        # Prevents the browser from interpreting files as a different MIME type.
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Prevents the site from being rendered within an <iframe> or <frame>.
        response['X-Frame-Options'] = 'DENY'
        
        # Enables the XSS protection filter built into most modern browsers.
        response['X-XSS-Protection'] = '1; mode=block'

        # --- Modern Security Headers ---
        # Controls how much referrer information is sent with requests.
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Disables browser features we don't need (e.g., camera, microphone).
        # This is a good "secure-by-default" policy for an API.
        response['Permissions-Policy'] = (
            'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
        )
        
        return response