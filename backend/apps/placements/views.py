from rest_framework import permissions
from apps.core.views import BaseViewSet
from rest_framework.decorators import action  
from apps.core.permissions import IsAdminRole
from .models import PlacementDrive, CompanyDrive, Job
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.response import SuccessResponse, ForbiddenResponse  
from .serializers import (
    PlacementDriveSerializer,
    CompanyDriveReadSerializer,
    CompanyDriveWriteSerializer,
    JobReadSerializer,
    JobWriteSerializer
)

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
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated(), IsAdminRole()]
    
    def get_queryset(self):
        queryset = self.queryset
        
        if hasattr(self.request.user, 'studentprofile'):
            queryset = queryset.filter(status='Open')
            
        return queryset
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def jobs(self, request, pk=None):
        """
        Get all jobs for a specific CompanyDrive
        URL: GET /api/v1/placements/company-drives/{id}/jobs/
        """
        company_drive = self.get_object()
        jobs = company_drive.jobs.all().select_related('company_drive').prefetch_related('eligible_programs')

        if hasattr(request.user, 'studentprofile'):
            if company_drive.status != 'Open':
                return ForbiddenResponse(
                    message="This drive is not open for applications.",
                    error_code="DRIVE_CLOSED"
                )
        
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
        from django.db.models import F
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
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated(), IsAdminRole()]