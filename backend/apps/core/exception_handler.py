"""
Custom API Exception Handler for the Placemate Project.

This module provides a centralized function to intercept all exceptions raised by the Django REST Framework and the application. 
Its primary purpose is to ensure that all API error responses are consistent by mapping different exception types to our custom, 
standardized ErrorResponse classes from `response.py`.
"""
import traceback
from django.http import Http404
from django.conf import settings
from django.db import IntegrityError
from rest_framework.exceptions import (
    AuthenticationFailed,
    ValidationError as DRFValidationError, 
    NotAuthenticated, 
    PermissionDenied, 
    Throttled
)
from .response import (
    ValidationErrorResponse, 
    UnauthorizedResponse, 
    ForbiddenResponse,
    NotFoundResponse, 
    ServerErrorResponse
)

def custom_exception_handler(exc, context):
    """
    Handles all exceptions for the API, returning a standardized error response.

    This function is registered in the DRF settings ('EXCEPTION_HANDLER').
    It inspects the type of the raw exception and returns an instance of the
    appropriate custom ErrorResponse subclass from `response.py`.

    Args:
        exc (Exception): The exception instance that was raised.
        context (dict): A dictionary containing the view that raised the exception.

    Returns:
        ErrorResponse: An instance of a custom error response class.
    """
    # Handle failed login attempts (wrong password).
    if isinstance(exc, AuthenticationFailed):
        return UnauthorizedResponse(message=exc.detail)
    
    # Handle DRF's validation errors (e.g., from a serializer).
    if isinstance(exc, DRFValidationError):
        return ValidationErrorResponse(errors=exc.detail)
    
    # Handle errors where a user is not logged in at all.
    if isinstance(exc, NotAuthenticated):
        return UnauthorizedResponse()
        
    # Handle errors where a logged-in user does not have permission.
    if isinstance(exc, PermissionDenied):
        return ForbiddenResponse()
        
    # Handle errors where a user has exceeded their request rate limit.
    if isinstance(exc, Throttled):
        return ForbiddenResponse(message=str(exc.detail))

    # Handle Django's standard 404 error when an object is not found.
    if isinstance(exc, Http404):
        return NotFoundResponse()
        
    # Handle database integrity errors (e.g., unique constraint violations).
    if isinstance(exc, IntegrityError):
        return ServerErrorResponse(message="Database constraint violation.")

    # --- Fallback for any other unexpected exception ---
    # This ensures a generic but structured 500 error is always returned.

    # In DEBUG mode, provide a detailed error message and traceback for easier debugging.
    if settings.DEBUG:
        message = f"Unhandled Exception: {exc.__class__.__name__}: {str(exc)}"
        traceback_info = traceback.format_exc()
        return ServerErrorResponse(message=message, traceback=traceback_info)
    else:
        # In production, provide a generic, user-friendly error message to avoid exposing sensitive system information.
        return ServerErrorResponse()