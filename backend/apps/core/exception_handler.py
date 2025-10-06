import traceback
from django.http import Http404
from django.conf import settings
from django.db import IntegrityError
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.exceptions import ValidationError as DRFValidationError, NotAuthenticated, PermissionDenied, Throttled
from .exceptions import (
    BaseAPIException, ValidationException, AuthenticationException,
    PermissionException, NotFoundException, ThrottledException,
    InternalServerException, DatabaseException
)

def custom_exception_handler(exc, context):
    if isinstance(exc, BaseAPIException):
        return Response(exc.detail, status=exc.status_code)
    
    if isinstance(exc, DRFValidationError):
        return Response(ValidationException(errors=exc.detail).detail, status=exc.status_code)
    
    if isinstance(exc, NotAuthenticated):
        return Response(AuthenticationException().detail, status=exc.status_code)
        
    if isinstance(exc, PermissionDenied):
        return Response(PermissionException().detail, status=exc.status_code)
        
    if isinstance(exc, Throttled):
        return Response(ThrottledException(detail=str(exc.detail)).detail, status=exc.status_code)

    if isinstance(exc, Http404):
        return Response(NotFoundException().detail, status=exc.status_code)
        
    if isinstance(exc, IntegrityError):
        return Response(DatabaseException(detail="Database constraint violation.").detail, status=exc.status_code)

    if settings.DEBUG:
        detail = f"{exc.__class__.__name__}: {str(exc)}"
        traceback_info = traceback.format_exc()
        response_data = InternalServerException(detail=detail).detail
        response_data['error']['traceback'] = traceback_info
    else:
        response_data = InternalServerException().detail
        
    return Response(response_data, status=500)