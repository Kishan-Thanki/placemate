"""
Custom API Exception Classes for the Placemate Project.

These classes serve as the internal "error language" for the application.
They can be raised from views or serializers to signal a specific type of error. 
The global `custom_exception_handler` will catch these and translate them into the appropriate standardized `ErrorResponse`.
"""
from rest_framework import status
from typing import Dict, Optional
from django.utils import timezone
from rest_framework.exceptions import APIException

class BaseAPIException(APIException):
    """
    Base exception class that formats errors to match our APIResponse structure.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_code = 'server_error'
    
    def __init__(self, detail: Optional[str] = None, code: Optional[str] = None, 
                 errors: Optional[Dict] = None, **kwargs):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code
            
        # Format to match our ErrorResponse structure
        formatted_detail = {
            'success': False,
            'message': detail,
            'data': None,
            'error_code': code,
            'timestamp': timezone.now().isoformat(),  
        }
        
        # Add errors if provided (for validation exceptions)
        if errors:
            formatted_detail['errors'] = errors
            
        # Add any additional context
        formatted_detail.update(kwargs)
        
        self.detail = formatted_detail

# --- 4xx Client Error Exceptions ---
class ValidationException(BaseAPIException):
    """Exception for data validation errors."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Invalid input data.'
    default_code = 'validation_error'

class AuthenticationException(BaseAPIException):
    """Exception for authentication failures."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'authentication_failed'

class PermissionException(BaseAPIException):
    """Exception for permission failures."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'

class NotFoundException(BaseAPIException):
    """Exception for when a resource is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'

class ConflictException(BaseAPIException):
    """Exception for resource conflicts."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource conflict occurred.'
    default_code = 'conflict'

class ThrottledException(BaseAPIException):
    """Exception for rate limiting."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Request was throttled. Please try again later.'
    default_code = 'throttled'

# --- 5xx Server Error Exceptions ---
class InternalServerException(BaseAPIException):
    """Exception for generic server errors."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An internal server error occurred.'
    default_code = 'internal_server_error'