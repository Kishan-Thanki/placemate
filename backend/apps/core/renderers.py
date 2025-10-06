import json
from rest_framework import status
from django.utils import timezone
from rest_framework.renderers import JSONRenderer

class StandardJSONRenderer(JSONRenderer):
    """
    Standard JSON renderer that formats all responses consistently
    """
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context['response'] if renderer_context else None
        
        if (response and 
            hasattr(response, 'data') and 
            isinstance(response.data, dict) and 
            'success' in response.data):
            return super().render(response.data, accepted_media_type, renderer_context)
        
        formatted_data = self._format_response(data, response)
        
        return super().render(formatted_data, accepted_media_type, renderer_context)
    
    def _format_response(self, data, response):
        """Format response data according to our standard"""
        if response is None:
            return data
            
        status_code = response.status_code
        success = status_code < 400
        
        if status_code == status.HTTP_204_NO_CONTENT:
            return {
                'success': True,
                'message': 'Resource deleted successfully',
                'timestamp': timezone.now().isoformat(),
                'data': None
            }
        
        if not success:
            return self._format_error_response(data, status_code)
        
        return self._format_success_response(data, status_code)
    
    def _format_success_response(self, data, status_code):
        """Format successful responses"""
        formatted = {
            'success': True,
            'timestamp': timezone.now().isoformat(),
            'data': data
        }
        
        if status_code == status.HTTP_201_CREATED:
            formatted['message'] = 'Resource created successfully'
        elif status_code == status.HTTP_200_OK:
            formatted['message'] = 'Operation completed successfully'
        
        return formatted
    
    def _format_error_response(self, data, status_code):
        """Format error responses"""
        error_message = self._get_error_message(data, status_code)
        
        formatted = {
            'success': False,
            'message': error_message,
            'timestamp': timezone.now().isoformat(),
            'data': None
        }
        
        if data and isinstance(data, dict):
            if 'detail' in data:
                formatted['error'] = data['detail']
            elif 'errors' in data:
                formatted['errors'] = data['errors']
            else:
                formatted['errors'] = data
        
        return formatted
    
    def _get_error_message(self, data, status_code):
        """Get appropriate error message based on status code"""
        error_messages = {
            status.HTTP_400_BAD_REQUEST: "Bad request",
            status.HTTP_401_UNAUTHORIZED: "Authentication required",
            status.HTTP_403_FORBIDDEN: "Access forbidden", 
            status.HTTP_404_NOT_FOUND: "Resource not found",
            status.HTTP_405_METHOD_NOT_ALLOWED: "Method not allowed",
            status.HTTP_409_CONFLICT: "Resource conflict",
            status.HTTP_422_UNPROCESSABLE_ENTITY: "Validation failed",
            status.HTTP_429_TOO_MANY_REQUESTS: "Too many requests",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Internal server error",
        }
        
        return error_messages.get(status_code, "An error occurred")