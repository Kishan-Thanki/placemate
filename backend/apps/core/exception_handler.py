"""
Custom API Exception Handler for the Placemate Project.

This is the central "translator" that intercepts all exceptions and maps them to a standardized, 
user-friendly response from `response.py`.
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
    ServerErrorResponse,
    ConflictResponse,
    ErrorResponse
)
from .exceptions import (
    ValidationException,
    AuthenticationException,
    PermissionException,
    NotFoundException,
    ConflictException,
    ThrottledException,
    InternalServerException
)

def custom_exception_handler(exc, context):
    """
    Handles all exceptions for the API, returning a standardized error response.
    """
    # --- 1. Handle Our Custom Application Exceptions ---
    if isinstance(exc, ValidationException):
        return ValidationErrorResponse(
            errors=exc.detail.get('errors', {}),
            message=exc.detail.get('message', exc.default_detail),
            error_code=exc.detail.get('error_code', exc.default_code)
        )
        
    if isinstance(exc, AuthenticationException):
        return UnauthorizedResponse(
            message=exc.detail.get('message', exc.default_detail),
            error_code=exc.detail.get('error_code', exc.default_code)
        )

    if isinstance(exc, PermissionException):
        return ForbiddenResponse(
            message=exc.detail.get('message', exc.default_detail),
            error_code=exc.detail.get('error_code', exc.default_code)
        )

    if isinstance(exc, NotFoundException):
        return NotFoundResponse(
            message=exc.detail.get('message', exc.default_detail),
            error_code=exc.detail.get('error_code', exc.default_code)
        )

    if isinstance(exc, ConflictException):
        return ConflictResponse(
            message=exc.detail.get('message', exc.default_detail),
            error_code=exc.detail.get('error_code', exc.default_code)
        )
        
    if isinstance(exc, ThrottledException):
        return ErrorResponse(
            message=exc.detail.get('message', exc.default_detail),
            status_code=exc.status_code,
            error_code=exc.detail.get('error_code', exc.default_code)
        )
    
    if isinstance(exc, InternalServerException):
        return ServerErrorResponse(
            message=exc.detail.get('message', exc.default_detail),
            error_code=exc.detail.get('error_code', exc.default_code)
        )

    # --- 2. Handle Standard DRF Exceptions ---
    if isinstance(exc, AuthenticationFailed):
        return UnauthorizedResponse(message=exc.detail)
    
    if isinstance(exc, DRFValidationError):
        return ValidationErrorResponse(errors=exc.detail)
    
    if isinstance(exc, NotAuthenticated):
        return UnauthorizedResponse()
        
    if isinstance(exc, PermissionDenied):
        return ForbiddenResponse()
        
    if isinstance(exc, Throttled):
        return ErrorResponse(
            message=str(exc.detail),
            status_code=exc.status_code,
            error_code='throttled'
        )

    # --- 3. Handle Standard Django Exceptions ---
    if isinstance(exc, Http404):
        return NotFoundResponse()
        
    if isinstance(exc, IntegrityError):
        return ConflictResponse(message="Database constraint violation.")

    # --- 4. Fallback for Unhandled Errors ---
    if settings.DEBUG:
        message = f"Unhandled Exception: {exc.__class__.__name__}: {str(exc)}"
        traceback_info = traceback.format_exc()
        return ServerErrorResponse(message=message, traceback=traceback_info)
    else:
        return ServerErrorResponse()