"""
Mobile-specific middleware to handle cookie and CORS issues
"""
from django.utils.deprecation import MiddlewareMixin

class MobileOptimizationMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Add headers that help mobile browsers with authentication
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        is_mobile = any(device in user_agent for device in ['mobile', 'android', 'iphone'])
        
        if is_mobile:
            response['Vary'] = 'Origin'
            response['Access-Control-Allow-Credentials'] = 'true'
            
        return response