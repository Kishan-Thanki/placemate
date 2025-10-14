"""
Custom Authentication Classes for the Placemate Project.

This module contains custom authentication backends that extend the functionality
of Django REST Framework and Simple JWT to meet the project's specific security requirements, 
such as handling JWTs from secure cookies.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    """
    A custom authentication class that extends Simple JWT's default behavior to read the JWT access token from a secure, HTTP-only cookie.

    This is the primary authentication method for the API. 
    It is configured as the `DEFAULT_AUTHENTICATION_CLASSES` in the DRF settings.
    """
    def authenticate(self, request):
        """
        Overrides the default `authenticate` method to look for the token in a cookie instead of the 'Authorization' header.

        This method is called by DRF at the beginning of every request to a protected endpoint to identify the user.

        Args:
            request: The incoming HttpRequest object.

        Returns:
            A tuple of (user, validated_token) if authentication is successful, or None otherwise.
        """
        # Attempt to retrieve the access token from a cookie named 'access_token'.
        access_token = request.COOKIES.get('access_token')

        # If no token is found in the cookies, authentication fails.
        if not access_token:
            return None

        try:
            # If a token is found, use the parent class's logic to validate it.
            # This checks the token's signature, expiration, and other claims.
            validated_token = self.get_validated_token(access_token)

            # If the token is valid, use the parent class's logic to fetch the user associated with this token from the database.
            return self.get_user(validated_token), validated_token
            
        except Exception as e:
            # Log the error for debugging
            print(f"Cookie authentication failed: {e}")
            return None