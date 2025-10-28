"""
Custom API Response Classes for the Placemate Project.

This module provides a set of reusable, standardized response classes that inherit from DRF's Response class. 
This is the single source of truth for the JSON structure of all API responses.
"""
from rest_framework import status
from django.utils import timezone
from typing import Any, Dict, List, Optional
from rest_framework.response import Response

class APIResponse(Response):
    """
    The base class for all standardized API responses.
    
    It wraps data in a consistent structure:
    {
        "success": bool,
        "message": str,
        "timestamp": "...",
        "data": Any,
        "pagination": { ... } // (Optional)
        "errors": { ... } // (Optional)
        "error_code": "..." // (Optional)
    }
    """
    def __init__(
        self,
        data: Any = None,
        message: str = None,
        status_code: int = status.HTTP_200_OK,
        success: bool = True,
        pagination: Optional[Dict] = None,
        **kwargs
    ):
        response_data = {
            'success': success,
            'message': message,
            'timestamp': timezone.now().isoformat(),
            'data': data,
        }
        if pagination:
            response_data['pagination'] = pagination
        
        # Add any other keys (e.g., 'error_code', 'errors', 'traceback')
        response_data.update(kwargs)
        
        super().__init__(data=response_data, status=status_code)

# --- Standard Success Responses ---
class SuccessResponse(APIResponse):
    """A standard success response (HTTP 200 OK)."""
    def __init__(self, data: Any = None, message: str = "Operation completed successfully", **kwargs):
        super().__init__(data=data, message=message, success=True, **kwargs)

class CreatedResponse(SuccessResponse):
    """A response for successfully creating a new resource (HTTP 201 Created)."""
    def __init__(self, data: Any = None, message: str = "Resource created successfully", **kwargs):
        super().__init__(data=data, message=message, status_code=status.HTTP_201_CREATED, **kwargs)

class DeleteSuccessResponse(SuccessResponse):
    """
    A response for successful deletion (HTTP 200 OK with confirmation message).
    We use 200 OK instead of 204 No Content to allow sending a response body.
    """
    def __init__(self, message: str = "Resource deleted successfully"):
        super().__init__(data=None, message=message, status_code=status.HTTP_200_OK)

class NoContentResponse(APIResponse):
    """
    A response for successful operations with no content.
    We use 200 OK instead of 204 No Content to allow sending a message for consistency.
    """
    def __init__(self, message: str = "Operation completed successfully"):
        super().__init__(data=None, message=message, status_code=status.HTTP_200_OK, success=True)

class PaginatedResponse(SuccessResponse):
    """A specialized success response for lists of data that are paginated."""
    def __init__(self, data: List, pagination_data: Dict, message: str = "Data retrieved successfully"):
        super().__init__(data=data, message=message, pagination=pagination_data)

# --- Standard Error Responses ---
class ErrorResponse(APIResponse):
    """The base class for all standard error responses."""
    def __init__(self, 
                 message: str = "An error occurred", 
                 status_code: int = status.HTTP_400_BAD_REQUEST, 
                 error_code: Optional[str] = None, 
                 **kwargs):
        
        # Add the error_code to the response if provided
        if error_code:
            kwargs['error_code'] = error_code
            
        super().__init__(data=None, message=message, status_code=status_code, success=False, **kwargs)

class ValidationErrorResponse(ErrorResponse):
    """A response for validation errors (HTTP 422 Unprocessable Entity)."""
    def __init__(self, errors: Dict, message: str = "Validation failed", error_code: str = "VALIDATION_ERROR"):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=error_code,
            errors=errors
        )

class NotFoundResponse(ErrorResponse):
    """A response for when a resource is not found (HTTP 404 Not Found)."""
    def __init__(self, message: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, error_code=error_code)

class UnauthorizedResponse(ErrorResponse):
    """A response for authentication failures (HTTP 401 Unauthorized)."""
    def __init__(self, message: str = "Authentication required", error_code: str = "UNAUTHORIZED"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, error_code=error_code)

class ForbiddenResponse(ErrorResponse):
    """A response for permission failures (HTTP 403 Forbidden)."""
    def __init__(self, message: str = "Access forbidden", error_code: str = "FORBIDDEN"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, error_code=error_code)

class ConflictResponse(ErrorResponse):
    """A response for resource conflicts (HTTP 409 Conflict)."""
    def __init__(self, message: str = "Resource conflict", error_code: str = "CONFLICT"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, error_code=error_code)

class ServerErrorResponse(ErrorResponse):
    """A response for unexpected server errors (HTTP 500 Internal Server Error)."""
    def __init__(self, message: str = "Internal server error", **kwargs):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, error_code="SERVER_ERROR", **kwargs)