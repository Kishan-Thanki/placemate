"""
Views package for user-related functionality.
"""
from .profile_views import CurrentUserView
from .admin_views import UserRegistrationView, UserViewSet
from .auth_views import LoginView, LoginRoleView, MyTokenRefreshView, LogoutView

__all__ = [
    'LoginView',
    'LoginRoleView',
    'MyTokenRefreshView',
    'LogoutView',
    'CurrentUserView', 
    'UserRegistrationView',
    'UserViewSet',
]