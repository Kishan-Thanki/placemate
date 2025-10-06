from rest_framework import status
from rest_framework.exceptions import APIException

class BaseAPIException(APIException):
    """Base exception class for all custom API exceptions"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_code = 'error'
    
    def __init__(self, detail=None, code=None, errors=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code
            
        self.detail = {
            'error': {
                'code': code,
                'message': detail,
                'type': self.__class__.__name__,
            }
        }
        
        if errors:
            self.detail['error']['details'] = errors

class ValidationException(BaseAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input.'
    default_code = 'validation_error'

class AuthenticationException(BaseAPIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'authentication_failed'

class PermissionException(BaseAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'

class NotFoundException(BaseAPIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'

class ThrottledException(BaseAPIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Request was throttled.'
    default_code = 'throttled'

class InternalServerException(BaseAPIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An internal server error occurred.'
    default_code = 'internal_server_error'

class DatabaseException(BaseAPIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A database error occurred.'
    default_code = 'database_error'