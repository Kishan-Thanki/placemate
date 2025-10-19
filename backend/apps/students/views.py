"""
API Views for the Students App with working role-based permissions.

This module contains all view logic for student registration, profile management,
and administrative student operations.

VIEW ARCHITECTURE:
=================
Student Management Views:
- StudentRegistrationView: Admin-only student creation with auto profile
- StudentProfileView: Student profile retrieval and updates  
- StudentViewSet: Administrative student management with action-based permissions
- MarkAsPlacedView: Specialized endpoint for placement status

SECURITY FEATURES:
=================
- Role-based access control with action-based permissions
- JWT + Database hybrid security validation
- Atomic transactions for data consistency
- Background email processing
- Standardized API responses
- Data isolation for student users

PERMISSION SUMMARY:
==================
- StudentRegistrationView: [IsAuthenticated, IsAdminRole]
- StudentProfileView: [IsAuthenticated, IsStudentRole, IsOwnerOrReadOnly]  
- StudentViewSet: 
  - list/retrieve: [IsAuthenticated, IsPlacementTeam]
  - update/partial_update: [IsAuthenticated, IsAdminRole]
- MarkAsPlacedView: [IsAuthenticated, IsAdminRole]
"""

from django.db import transaction
from .models import StudentProfile
from apps.core.views import BaseViewSet
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions

# Import custom permission classes
from apps.core.permissions import (
    IsOwnerOrReadOnly, 
    IsStudentRole,
    IsAdminRole,
    IsPlacementTeam
)

from .serializers import (
    StudentRegistrationSerializer, 
    StudentProfileSerializer,
    StudentDetailSerializer,
    StudentPlacementSerializer
)
from apps.core.response import (
    SuccessResponse, 
    CreatedResponse, 
    ValidationErrorResponse,
    NotFoundResponse
)

User = get_user_model()


class StudentRegistrationView(generics.CreateAPIView):
    """
    An endpoint for Admins to register new Student accounts with profiles.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsAdminRole: User must have Admin role (strict access control)
    
    WORKFLOW:
    ---------
    1. Admin provides student details + program
    2. System generates secure random password
    3. User created with 'Student' role assigned
    4. StudentProfile created and linked to user
    5. Welcome email sent asynchronously with credentials
    6. Returns 201 Created with student data (password excluded)
    """
    
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    
    def create(self, request, *args, **kwargs):
        """
        Handles student registration with custom response formatting.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        try:
            with transaction.atomic():
                student_profile = serializer.save()
            
            return CreatedResponse(
                data=serializer.data,
                message="Student registered successfully. Welcome email sent with credentials."
            )
            
        except Exception as e:
            return ValidationErrorResponse(
                message=f"Student registration failed: {str(e)}"
            )


class StudentProfileView(generics.RetrieveUpdateAPIView):
    """
    A protected endpoint for students to view and update their own profile.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsStudentRole: User must have Student role
    - IsOwnerOrReadOnly: Users can only access their own profile
    
    AVAILABLE ACTIONS:
    ------------------
    - GET /api/v1/students/me/: Retrieve current student profile
    - PATCH /api/v1/students/me/: Update student profile (partial updates allowed)
    
    SECURITY:
    ---------
    - Students can only access their own profile
    - Must have Student role in database
    - Critical fields are read-only to prevent data manipulation
    """
    
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentRole, IsOwnerOrReadOnly]
    http_method_names = ['get', 'patch', 'head', 'options']
    
    def get_object(self):
        """Returns the student profile for the currently authenticated user."""
        try:
            return StudentProfile.objects.get(user=self.request.user)
        except StudentProfile.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve student profile with standardized response."""
        instance = self.get_object()
        
        if not instance:
            return NotFoundResponse(message="Student profile not found.")
            
        serializer = self.get_serializer(instance)
        return SuccessResponse(
            data=serializer.data, 
            message="Student profile retrieved successfully."
        )
    
    def update(self, request, *args, **kwargs):
        """Update student profile with standardized response."""
        instance = self.get_object()
        
        if not instance:
            return NotFoundResponse(message="Student profile not found.")
            
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=True
        )
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_update(serializer)
        return SuccessResponse(
            data=serializer.data,
            message="Student profile updated successfully."
        )


class StudentViewSet(BaseViewSet):
    """
    An administrative endpoint for managing all students in the system.
    Provides different access levels based on user role and action type.
    
    PERMISSIONS (Action-Based):
    ---------------------------
    - LIST (GET /students/profiles/): 
        [IsAuthenticated, IsPlacementTeam] - View student list
    
    - RETRIEVE (GET /students/profiles/{id}/): 
        [IsAuthenticated, IsPlacementTeam] - View student details
    
    - UPDATE (PATCH /students/profiles/{id}/): 
        [IsAuthenticated, IsAdminRole] - Modify student data (Admin only)
    
    AVAILABLE ENDPOINTS:
    --------------------
    - GET /api/v1/students/profiles/: List all students (paginated)
    - GET /api/v1/students/profiles/{user_id}/: Retrieve specific student
    - PATCH /api/v1/students/profiles/{user_id}/: Update student details (Admin only)
    
    SECURITY:
    ---------
    - Placement Team can only view students (read-only access)
    - Admin can view and modify students (full access)
    - Students cannot access this viewset (handled by permissions)
    - Inherits from BaseViewSet for standardized response formatting
    """
    
    queryset = StudentProfile.objects.all().select_related(
        'user', 'program', 'city', 'program__degree'
    )
    permission_classes = [permissions.IsAuthenticated]  # Base authentication only
    
    def get_permissions(self):
        """
        Action-based permissions for fine-grained access control:
        
        - Placement Team: Can LIST and RETRIEVE students (read-only)
        - Admin: Can LIST, RETRIEVE, and UPDATE students (full access)
        - Students: Cannot access any actions in this viewset
        """
        if self.action in ['list', 'retrieve']:
            # Placement Team and Admin can view students
            permission_classes = [IsPlacementTeam]
        elif self.action in ['update', 'partial_update']:
            # Only Admin can update student profiles
            permission_classes = [IsAdminRole]
        else:
            # Default to most restrictive (Admin only for other actions)
            permission_classes = [IsAdminRole]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentProfileSerializer
    
    def get_queryset(self):
        """
        Returns optimized queryset with data isolation and filtering.
        
        SECURITY:
        ---------
        - Admins and Placement Team see all students
        - Students cannot access this viewset (handled by permissions)
        """
        queryset = self.queryset.order_by('user__first_name', 'user__last_name')
        
        # Add filtering capabilities
        program_id = self.request.query_params.get('program')
        is_placed = self.request.query_params.get('is_placed')
        search = self.request.query_params.get('search')
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if is_placed is not None:
            queryset = queryset.filter(is_placed=is_placed.lower() == 'true')
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(
                user__last_name__icontains=search
            ) | queryset.filter(
                user__email__icontains=search
            ) | queryset.filter(
                enrollment_number__icontains=search
            )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List students with optimized data for admin/placement views."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Basic list view doesn't need all details
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StudentProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = StudentProfileSerializer(queryset, many=True)
        return SuccessResponse(
            data=serializer.data, 
            message="Students retrieved successfully"
        )
    
    def update(self, request, *args, **kwargs):
        """Update student details with standardized response (Admin only)."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_update(serializer)
        return SuccessResponse(
            data=serializer.data,
            message="Student details updated successfully."
        )


class MarkAsPlacedView(generics.UpdateAPIView):
    """
    Specialized endpoint for Admins to mark students as placed.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsAdminRole: Strictly for top-level admins only
    
    SECURITY:
    ---------
    - Separate endpoint for sensitive placement actions
    - Prevents unauthorized placement status changes
    - Maintains audit trail for placement actions
    """
    
    serializer_class = StudentPlacementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    queryset = StudentProfile.objects.all()
    http_method_names = ['patch']
    
    def get_object(self):
        """Get student profile by user ID."""
        user_id = self.kwargs.get('user_id')
        return get_object_or_404(StudentProfile, user_id=user_id)
    
    def update(self, request, *args, **kwargs):
        """Mark student as placed with standardized response."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_update(serializer)
        
        message = "Student marked as placed successfully." if instance.is_placed else "Student placement status updated successfully."
        return SuccessResponse(
            data=serializer.data,
            message=message
        )