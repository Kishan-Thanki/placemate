"""
URL Configuration for the Users App.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, CurrentUserView, UserViewSet

# A router automatically generates the standard URLs for a ViewSet.
router = DefaultRouter()
router.register(r'manage', UserViewSet, basename='user-manage')

urlpatterns = [
    # --- Specialized Action Endpoints ---
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    
    # --- Administrative CRUD Endpoints ---
    # This includes the router-generated URLs for the UserViewSet.
    # It will create endpoints like:
    #   - GET /api/v1/users/manage/ (List all users)
    #   - GET /api/v1/users/manage/{id}/ (Retrieve a specific user)
    #   - PATCH /api/v1/users/manage/{id}/ (Update a specific user)
    path('', include(router.urls)),
]