"""
API URL Configuration for Version 1 (v1)

This file acts as the central router for all API endpoints under the `/api/v1/` prefix.
It consolidates global endpoints (like authentication) and includes URL patterns from various application-specific files.

AUTHENTICATION ENDPOINTS:
- POST /api/v1/token/          : User login, returns JWT tokens in HTTP-only cookies
- POST /api/v1/token/refresh/  : Refresh access token using refresh token
- POST /api/v1/logout/         : Logout user, blacklist refresh token, clear cookies

APPLICATION ENDPOINTS:
- /api/v1/users/               : User management (registration, profile, admin operations)
- /api/v1/password-reset/      : Password reset workflow (via django_rest_passwordreset)

SECURITY NOTES:
- JWT tokens are stored in secure, HTTP-only cookies
- Refresh tokens are blacklisted on logout
- All endpoints except token obtain/refresh require authentication
"""
from django.urls import path, include
from apps.users.views import MyTokenObtainPairView, MyTokenRefreshView, LogoutView

# A list of URL patterns that Django will use to route incoming requests.
urlpatterns = [
    # --- Global Authentication Endpoints ---
    # Handles user login, sets access_token and refresh_token in cookies
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Generates new access token using valid refresh token from cookies
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    
    # Logs out user by blacklisting refresh token and clearing auth cookies
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # --- Application-Specific Endpoints ---
    # Includes: /register/, /me/, /manage/ (CRUD operations for admins)
    path('users/', include('apps.users.urls')),
    
    # Password reset workflow: request, confirm, validate endpoints
    path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]