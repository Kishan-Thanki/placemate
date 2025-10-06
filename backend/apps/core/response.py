from typing import Any, Dict, List
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response

class APIResponse(Response):
    """
    Standard API Response format for all endpoints
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
        # Standard response structure
        response_data = {
            'success': success,
            'message': message,
            'timestamp': timezone.now().isoformat(),
            'data': data,
        }
        
        # Add pagination if provided
        if pagination:
            response_data['pagination'] = pagination
            
        # Add any additional kwargs
        response_data.update(kwargs)
        
        super().__init__(data=response_data, status=status_code)


class SuccessResponse(APIResponse):
    """Standard success responses"""
    def __init__(self, data: Any = None, message: str = "Operation completed successfully", **kwargs):
        super().__init__(data=data, message=message, success=True, **kwargs)


class ErrorResponse(APIResponse):
    """Standard error responses"""
    def __init__(self, message: str = "An error occurred", status_code: int = status.HTTP_400_BAD_REQUEST, **kwargs):
        super().__init__(data=None, message=message, status_code=status_code, success=False, **kwargs)


class CreatedResponse(SuccessResponse):
    """201 Created responses"""
    def __init__(self, data: Any = None, message: str = "Resource created successfully", **kwargs):
        super().__init__(data=data, message=message, status_code=status.HTTP_201_CREATED, **kwargs)


class NoContentResponse(APIResponse):
    """204 No Content responses"""
    def __init__(self, message: str = "Resource deleted successfully"):
        super().__init__(data=None, message=message, status_code=status.HTTP_204_NO_CONTENT, success=True)
    
class PaginatedResponse(SuccessResponse):
    """Paginated data responses"""
    def __init__(self, data: List, pagination_data: Dict, message: str = "Data retrieved successfully"):
        super().__init__(data=data, message=message, pagination=pagination_data)

class ValidationErrorResponse(ErrorResponse):
    """Validation error responses"""
    def __init__(self, errors: Dict, message: str = "Validation failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            errors=errors
        )

class NotFoundResponse(ErrorResponse):
    """404 Not Found responses"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedResponse(ErrorResponse):
    """401 Unauthorized responses"""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenResponse(ErrorResponse):
    """403 Forbidden responses"""
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class ConflictResponse(ErrorResponse):
    """409 Conflict responses"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT)


class ServerErrorResponse(ErrorResponse):
    """500 Server Error responses"""
    def __init__(self, message: str = "Internal server error"):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)