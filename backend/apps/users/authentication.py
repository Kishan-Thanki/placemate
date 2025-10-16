"""
Custom Authentication Classes for the Placemate Project.

This module contains custom authentication backends that extend the functionality
of Django REST Framework and Simple JWT to meet the project's specific security requirements,  such as handling JWTs from secure cookies.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that retrieves the access token from HTTP-only cookies
    instead of the standard Authorization header.
    
    This provides enhanced security against XSS attacks by storing tokens in HttpOnly cookies
    that are inaccessible to client-side JavaScript.
    
    SECURITY FEATURES:
    - HttpOnly cookies prevent XSS attacks from accessing tokens
    - Secure flag ensures cookies are only sent over HTTPS in production
    - SameSite attribute provides CSRF protection
    - Automatic token validation and user resolution via Simple JWT
    
    USAGE:
    This class is configured as the primary authentication method in Django REST Framework
    settings and is automatically applied to all API requests.
    
    AUTHENTICATION FLOW:
    1. Extract access_token from request cookies
    2. Validate token signature and expiration using Simple JWT
    3. Resolve user from validated token claims
    4. Return (user, token) tuple for successful authentication
    
    ERROR HANDLING:
    - Returns None if no access token is present (authentication fails)
    - Returns None if token validation fails (invalid/expired token)
    - Exceptions are caught and logged, returning None for graceful failure
    
    DEPENDENCIES:
    - Requires Simple JWT for token validation and user resolution
    - Depends on cookies being properly set by token obtain/refresh views
    """
    
    def authenticate(self, request):
        """
        Authenticate the request using JWT token from HTTP-only cookies.
        
        Args:
            request: HttpRequest object containing cookies and other request data
            
        Returns:
            tuple: (user, token) if authentication successful, None otherwise
        """
        # Extract access token from cookies
        access_token = request.COOKIES.get('access_token')

        # Return None if no token is present (authentication will fail)
        if not access_token:
            return None

        try:
            # Validate the token using Simple JWT's built-in validation
            # This checks signature, expiration, and other standard claims
            validated_token = self.get_validated_token(access_token)
            
            # Resolve the user from the validated token
            user = self.get_user(validated_token)
            
            # Return the authenticated user and token
            return (user, validated_token)
            
        except Exception:
            # Token validation failed (invalid signature, expired, etc.)
            # Return None to indicate authentication failure
            return None