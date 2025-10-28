"""
URL Configuration for the Students App.

This module defines all URL routes for student management endpoints,
following the established API patterns from the users app.

URL PATTERNS:
============
Student Management:
- POST   /api/v1/students/register/    : Admin student registration
- GET    /api/v1/students/me/          : Current student profile
- PATCH  /api/v1/students/me/          : Update student profile

Administrative Endpoints:
- GET    /api/v1/students/profiles/    : List all students (admin/placement)
- GET    /api/v1/students/profiles/{user_id}/ : Retrieve specific student
- PATCH  /api/v1/students/profiles/{user_id}/ : Update student details
- PATCH  /api/v1/students/profiles/{user_id}/mark_as_placed/ : Mark as placed

PERMISSIONS:
============
- Student registration: IsAdminRole only
- Student profile: IsOwnerOrReadOnly (students see only their own)
- Student management: IsAdminRole | IsPlacementTeam
- Mark as placed: IsAdminRole only
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentRegistrationView,
    StudentProfileView, 
    StudentViewSet,
    MarkAsPlacedView
)

# Router for administrative student management
router = DefaultRouter()
router.register(r'profiles', StudentViewSet, basename='student-profiles')

urlpatterns = [
    # --- Student Registration (Admin Only) ---
    path('register/', StudentRegistrationView.as_view(), name='student-register'),
    
    # --- Student Self-Service ---
    path('me/', StudentProfileView.as_view(), name='current-student'),
    
    # --- Administrative Student Management ---
    path('', include(router.urls)),
    
    # --- Specialized Placement Action ---
    path(
        'profiles/<int:user_id>/mark_as_placed/',
        MarkAsPlacedView.as_view(),
        name='mark-student-placed'
    ),
]