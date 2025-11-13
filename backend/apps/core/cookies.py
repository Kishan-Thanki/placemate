"""
Centralized cookie configuration for consistent behavior across all environments.
OPTIMIZED FOR MOBILE BROWSERS - Uses Lax instead of None for production
"""
from django.conf import settings

def get_cookie_settings():
    """
    Returns secure cookie settings appropriate for the current environment.
    
    Production: Secure=True, SameSite=Lax (mobile compatible)
    Development: Secure=False, SameSite=Lax (localhost)
    """
    is_secure = not settings.DEBUG
    
    # PERMANENT FIX: Always use Lax for mobile compatibility
    # SameSite=None breaks on mobile browsers, Lax works everywhere
    samesite = "Lax"
    
    # Only add domain in production for cross-subdomain support
    cookie_settings = {
        "httponly": True,
        "secure": is_secure,
        "samesite": samesite,
    }
    
    # Add domain only in production for Render subdomains
    if not settings.DEBUG:
        cookie_settings["domain"] = ".onrender.com"
    
    return cookie_settings