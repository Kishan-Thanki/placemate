from rest_framework import permissions
from apps.core.views import BaseViewSet
from rest_framework.decorators import action  
from apps.core.permissions import IsAdminRole
from .models import PlacementDrive, CompanyDrive, Job
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.response import SuccessResponse  
from .serializers import (
    PlacementDriveSerializer,
    CompanyDriveReadSerializer,
    CompanyDriveWriteSerializer,
    JobReadSerializer,
    JobWriteSerializer
)
from django.db.models import F

class PlacementDriveViewSet(BaseViewSet):
    """
    Placement Drive management - ADMIN ONLY
    """
    queryset = PlacementDrive.objects.all().order_by('-created_at')
    serializer_class = PlacementDriveSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['title']


class CompanyDriveViewSet(BaseViewSet):
    """
    Company Drive management with role-based access
    """
    queryset = CompanyDrive.objects.all().select_related('company', 'placement_drive')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['placement_drive', 'company', 'drive_type', 'status']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CompanyDriveReadSerializer
        return CompanyDriveWriteSerializer
    
    def get_permissions(self):
        """
        Permission logic based on HTTP method:
        - GET requests (read operations): Any authenticated user
        - POST/PUT/PATCH/DELETE (write operations): Admin only
        
        This works for both standard actions (list, retrieve) and custom actions (jobs, etc.)
        """
        # SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS') - these are read-only operations
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        else:
            # Write operations require admin role
            return [permissions.IsAuthenticated(), IsAdminRole()]
    
    def get_queryset(self):
        queryset = self.queryset
        
        if hasattr(self.request.user, 'studentprofile'):
            queryset = queryset.filter(status='Open')
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def jobs(self, request, pk=None):
        """
        Get all jobs for a specific CompanyDrive
        URL: GET /api/v1/placements/company-drives/{id}/jobs/
        
        Note: Permission is handled by get_permissions() based on HTTP method (GET = read = any authenticated user)
        Access control is handled by get_queryset() which filters to 'Open' drives for students
        """
        company_drive = self.get_object()
        jobs = company_drive.jobs.all().select_related('company_drive').prefetch_related('eligible_programs')
        
        serializer = JobReadSerializer(jobs, many=True)
        return SuccessResponse(
            data=serializer.data,
            message=f"Jobs retrieved for {company_drive.company.name} drive"
        )


class JobViewSet(BaseViewSet):
    """
    Job management - Add jobs to existing CompanyDrives
    """
    queryset = Job.objects.all().select_related(
        'company_drive', 'company_drive__company', 'company_drive__placement_drive'
    ).prefetch_related('eligible_programs')

    def get_queryset(self):
        queryset = self.queryset.annotate(
            company_name=F('company_drive__company__name'),
            drive_title=F('company_drive__placement_drive__title')
        )
        
        if hasattr(self.request.user, 'studentprofile'):
            queryset = queryset.filter(company_drive__status='Open')
            
        return queryset
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company_drive', 'title']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return JobReadSerializer
        return JobWriteSerializer
    
    def get_permissions(self):
        """
        Permission logic based on HTTP method:
        - GET requests (read operations): Any authenticated user
        - POST/PUT/PATCH/DELETE (write operations): Admin only
        """
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated(), IsAdminRole()]