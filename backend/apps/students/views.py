"""
API Views for the Students App
"""
from .models import StudentProfile
from apps.core.views import BaseViewSet
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
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
    """Admin-only student registration with profiles"""
    
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        try:
            student_profile = serializer.save()
            
            return CreatedResponse(
                data=serializer.data,
                message="Student registered successfully. Welcome email sent."
            )
            
        except Exception as e:
            return ValidationErrorResponse(
                message=f"Student registration failed: {str(e)}"
            )


class StudentProfileView(generics.RetrieveUpdateAPIView):
    """Student profile management endpoint"""
    
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentRole, IsOwnerOrReadOnly]
    http_method_names = ['get', 'patch', 'head', 'options']
    
    def get_object(self):
        try:
            return StudentProfile.objects.get(user=self.request.user)
        except StudentProfile.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance:
            return NotFoundResponse(message="Student profile not found")
            
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="Profile retrieved")
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance:
            return NotFoundResponse(message="Student profile not found")
            
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Profile updated")


class StudentViewSet(BaseViewSet):
    """Administrative student management with role-based access"""
    
    queryset = StudentProfile.objects.all().select_related(
        'user', 'program', 'city', 'program__degree'
    )
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsPlacementTeam]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAdminRole]
        else:
            permission_classes = [IsAdminRole]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentProfileSerializer
    
    def get_queryset(self):
        queryset = self.queryset.order_by('user__first_name', 'user__last_name')
        
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
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StudentProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = StudentProfileSerializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="Students retrieved")
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Student updated")


class MarkAsPlacedView(generics.UpdateAPIView):
    """Admin endpoint for marking students as placed"""
    
    serializer_class = StudentPlacementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    queryset = StudentProfile.objects.all()
    http_method_names = ['patch']
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        return get_object_or_404(StudentProfile, user_id=user_id)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_update(serializer)
        
        message = "Student marked as placed" if instance.is_placed else "Placement status updated"
        return SuccessResponse(data=serializer.data, message=message)