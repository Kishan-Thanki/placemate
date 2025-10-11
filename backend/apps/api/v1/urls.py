"""
API URL Configuration for Version 1 (v1)

This file acts as the central router for all API endpoints under the `/api/v1/` prefix.
It consolidates global endpoints (like authentication) and includes URL patterns
from various application-specific files.
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import MyTokenObtainPairView, LogoutView

# A list of URL patterns that Django will use to route incoming requests.
urlpatterns = [
    # --- Global Authentication Endpoints ---
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # --- Application-Specific Endpoints ---
    path('users/', include('apps.users.urls')),
    path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]