"""
Centralized cookie configuration for consistent behavior across all environments.
"""
from django.conf import settings

def get_cookie_settings():
    """
    Returns secure cookie settings appropriate for the current environment.
    
    Production: Secure=True, SameSite=None (cross-domain)
    Development: Secure=False, SameSite=Lax (localhost)
    """
    is_secure = not settings.DEBUG
    samesite = "None" if is_secure else "Lax"
    
    return {
        "httponly": True,
        "secure": is_secure,
        "samesite": samesite,
    }