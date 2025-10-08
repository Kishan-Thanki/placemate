"""
Custom API Response Classes for the Placemate Project.

This module provides a set of reusable, standardized response classes that inherit from DRF's Response class. 
The primary goal is to ensure that all API responses (both success and error) have a consistent and predictable JSON structure,
making the API easier for frontend developers to consume.
"""
from typing import Any, Dict, List
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response

class APIResponse(Response):
    """
    An APIResponse class that standardizes the format for all API endpoints.

    It wraps the original data in a consistent structure containing keys like
    'success', 'message', 'timestamp', and 'data'.
    """
    def __init__(
        self,
        data: Any = None,
        message: str = None,
        status_code: int = status.HTTP_200_OK,
        success: bool = True,
        pagination: Dict = None,
        **kwargs
    ):
        # The standard, consistent structure for all API responses.
        response_data = {
            'success': success,
            'message': message,
            'timestamp': timezone.now().isoformat(),
            'data': data,
        }
        
        # If pagination data is provided, add it to the response.
        if pagination:
            response_data['pagination'] = pagination
            
        # Allow for additional custom keys to be added to the response.
        # This is useful for specific cases like 'errors' in validation responses.
        response_data.update(kwargs)
        
        # Call the parent DRF Response class to finalize the response.
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


class NoContentResponse(APIResponse):
    """A response for successful deletion with no body content (HTTP 204 No Content)."""
    def __init__(self, message: str = "Resource deleted successfully"):
        super().__init__(data=None, message=message, status_code=status.HTTP_204_NO_CONTENT, success=True)
    

class PaginatedResponse(SuccessResponse):
    """A specialized success response for lists of data that are paginated."""
    def __init__(self, data: List, pagination_data: Dict, message: str = "Data retrieved successfully"):
        super().__init__(data=data, message=message, pagination=pagination_data)


# --- Standard Error Responses ---

class ErrorResponse(APIResponse):
    """The base class for all standard error responses."""
    def __init__(self, message: str = "An error occurred", status_code: int = status.HTTP_400_BAD_REQUEST, **kwargs):
        super().__init__(data=None, message=message, status_code=status_code, success=False, **kwargs)


class ValidationErrorResponse(ErrorResponse):
    """A response for validation errors (HTTP 422 Unprocessable Entity)."""
    def __init__(self, errors: Dict, message: str = "Validation failed"):
        # The 'errors' kwarg will be added to the final response dictionary.
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            errors=errors
        )

class NotFoundResponse(ErrorResponse):
    """A response for when a requested resource is not found (HTTP 404 Not Found)."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedResponse(ErrorResponse):
    """A response for when authentication is required but missing (HTTP 401 Unauthorized)."""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenResponse(ErrorResponse):
    """A response for when a user is authenticated but lacks permission (HTTP 403 Forbidden)."""
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class ConflictResponse(ErrorResponse):
    """A response for when an action conflicts with the current state of a resource (HTTP 409 Conflict)."""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT)


class ServerErrorResponse(ErrorResponse):
    """A response for an unexpected server error (HTTP 500 Internal Server Error)."""
    def __init__(self, message: str = "Internal server error"):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)