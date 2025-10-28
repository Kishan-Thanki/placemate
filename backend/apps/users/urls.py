"""
ENHANCED URL Configuration for the Users App with complete authentication and role management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    LoginRoleView, 
    MyTokenRefreshView,
    LogoutView,
    UserRegistrationView,
    CurrentUserView,
    UserViewSet
)

# Router for user management with role endpoints
router = DefaultRouter()
router.register(r'manage', UserViewSet, basename='user-manage')

urlpatterns = [
    # --- Authentication Endpoints ---
    path('token/', LoginView.as_view(), name='token-obtain'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # --- Role Selection Endpoint ---
    path('auth/select-role/', LoginRoleView.as_view(), name='select-role'),  
    
    # --- User Registration & Profile ---
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    
    # --- Administrative User Management ---
    path('', include(router.urls)),
]