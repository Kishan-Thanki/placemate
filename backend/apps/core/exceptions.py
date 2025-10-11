"""
Custom API Exception Classes for the Placemate Project.

This module defines a set of custom, standardized exception classes that inherit from DRF's APIException. 
The primary goal is to provide a consistent and structured format for all API error responses.

Each exception class is pre-configured with a default status code, message, and a unique error code.
"""
from rest_framework import status
from rest_framework.exceptions import APIException

class BaseAPIException(APIException):
    """
    The base exception class for all custom API exceptions in the project.

    This class ensures that every error response follows a consistent JSON structure:
    {
        "error": {
            "code": "error_code",
            "message": "A descriptive message.",
            "type": "ExceptionClassName"
        }
    }
    """
    # Default HTTP status code to be returned.
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    # Default user-friendly message to be included in the response.
    default_detail = 'A server error occurred.'
    # Default unique code for this type of error.
    default_code = 'error'
    
    def __init__(self, detail=None, code=None, errors=None):
        """
        Initializes the exception with a structured detail dictionary.
        """
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code
            
        # This is the standardized structure for all error responses.
        self.detail = {
            'error': {
                'code': code,
                'message': detail,
                'type': self.__class__.__name__,
            }
        }
        
        # If there are specific field errors (like in validation), add them.
        if errors:
            self.detail['error']['details'] = errors

# --- 4xx Client Error Exceptions ---

class ValidationException(BaseAPIException):
    """An exception for data validation errors (HTTP 400 Bad Request)."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input.'
    default_code = 'validation_error'

class AuthenticationException(BaseAPIException):
    """An exception for authentication failures (HTTP 401 Unauthorized)."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'authentication_failed'

class PermissionException(BaseAPIException):
    """An exception for permission failures (HTTP 403 Forbidden)."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'

class NotFoundException(BaseAPIException):
    """An exception for when a resource is not found (HTTP 404 Not Found)."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'

class ThrottledException(BaseAPIException):
    """An exception for when a user exceeds their request rate limit (HTTP 429 Too Many Requests)."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Request was throttled.'
    default_code = 'throttled'

# --- 5xx Server Error Exceptions ---

class InternalServerException(BaseAPIException):
    """An exception for generic, unhandled server errors (HTTP 500 Internal Server Error)."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An internal server error occurred.'
    default_code = 'internal_server_error'

class DatabaseException(BaseAPIException):
    """An exception for database-related errors (HTTP 500 Internal Server Error)."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A database error occurred.'
    default_code = 'database_error'