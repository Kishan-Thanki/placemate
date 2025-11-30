"""
Main views module - exports all views for backward compatibility.
"""
from .views import (
    LoginView,
    LoginRoleView,
    MyTokenRefreshView,
    LogoutView,
    CurrentUserView,
    UserRegistrationView,
    UserViewSet,
)

__all__ = [
    'LoginView',
    'LoginRoleView',
    'MyTokenRefreshView', 
    'LogoutView',
    'CurrentUserView',
    'UserRegistrationView',
    'UserViewSet',
]