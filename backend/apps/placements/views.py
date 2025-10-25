"""
API Views for the Placements App.
"""
from rest_framework import permissions
from apps.core.views import BaseViewSet
from apps.core.permissions import IsAdminRole
from .models import PlacementDrive, CompanyDrive
from .serializers import (
    PlacementDriveSerializer,
    CompanyDriveWriteSerializer,
    CompanyDriveReadSerializer
)


class PlacementDriveViewSet(BaseViewSet):
    """
    Placement Drive management - STRICTLY ADMIN ONLY.
    
    PERMISSIONS:
    - Only Admin can perform ANY action
    - Students and Placement Cell CANNOT access at all
    
    Uses simple BaseViewSet CRUD - no custom logic needed.
    """
    
    queryset = PlacementDrive.objects.all().order_by('-created_at')
    serializer_class = PlacementDriveSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class CompanyDriveViewSet(BaseViewSet):
    """
    Company Drive management with role-based access.
    
    PERMISSIONS:
    - Admin: Full CRUD access
    - Students & Placement: Read-only access
    
    Uses Read/Write serializer pattern:
    - Read: CompanyDriveReadSerializer (rich nested data)
    - Write: CompanyDriveWriteSerializer (simple FK fields)
    - No duplicate validation - relies on database unique_together
    """
    
    queryset = CompanyDrive.objects.all().select_related('company', 'drive')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Use read serializer for GET, write serializer for mutations."""
        if self.request.method == 'GET':
            return CompanyDriveReadSerializer
        return CompanyDriveWriteSerializer
    
    def get_permissions(self):
        """Admin can do everything, others can only read."""
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated(), IsAdminRole()]
    
    def get_queryset(self):
        """Optimized queryset with basic filtering."""
        queryset = self.queryset.order_by('application_deadline')
        
        drive_id = self.request.query_params.get('drive_id')
        status = self.request.query_params.get('status')
        
        if drive_id:
            queryset = queryset.filter(drive_id=drive_id)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset