"""
URL Configuration for the Users App.

This file defines the URL patterns for endpoints that are specific to the
'users' resource, such as user registration and fetching the current user's
profile details.

These URLs are included under the `/api/v1/users/` prefix by the main API router.
"""
from django.urls import path
from .views import UserRegistrationView, CurrentUserView

urlpatterns = [
    # Defines the endpoint for new user registration.
    # Maps POST requests to the UserRegistrationView.
    # URL: /api/v1/users/register/
    path('register/', UserRegistrationView.as_view(), name='user-register'),

    # Defines the endpoint for a logged-in user to get or update their own profile.
    # Maps GET and PATCH requests to the CurrentUserView.
    # URL: /api/v1/users/me/
    path('me/', CurrentUserView.as_view(), name='current-user'),
]