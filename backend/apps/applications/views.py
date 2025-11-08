from rest_framework import permissions
from apps.core.views import BaseViewSet
from rest_framework.decorators import action  
from apps.core.permissions import IsAdminRole, IsStudentRole, IsPlacementTeam
from .models import CompanyDriveApplication, JobPreference
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.response import SuccessResponse, ForbiddenResponse  
from .serializers import (
    JobPreferenceSerializer,
    CompanyDriveApplicationSerializer,
    CompanyDriveApplicationCreateSerializer
)

# Create your views here.
class CompanyDriveApplicationViewSet(BaseViewSet):
    
    queryset = CompanyDriveApplication.objects.all().select_related('company_drive', 'student')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company_drive', 'student', 'status']

    # Student Actions
    @action(detail=True, methods=['post'], permission_classes=[IsStudentRole])
    def withdraw(self, request, pk=None):
        """POST /api/applications/1/withdraw/"""
        application = self.get_object()
        
        if application.status != 'Applied':
            return ErrorResponse(message="Can only withdraw 'Applied' applications")
        
        application.status = 'Withdrawn'
        application.save()
        
        return SuccessResponse(message="Application withdrawn successfully")

    @action(detail=True, methods=['post'], permission_classes=[IsStudentRole])
    def accept_offer(self, request, pk=None):
        """POST /api/applications/1/accept_offer/"""
        application = self.get_object()
        job_id = request.data.get('job_id')
        
        if not job_id:
            return ValidationErrorResponse({'job_id': 'This field is required'})
        
        if application.status != 'Offered':
            return ErrorResponse(message="No job offer to accept")
        
        application.status = 'Accepted'
        application.offered = job_id
        application.save()
        
        return SuccessResponse(message="Job offer accepted successfully")

    @action(detail=True, methods=['post'], permission_classes=[IsStudentRole])
    def decline_offer(self, request, pk=None):
        """POST /api/applications/1/decline_offer/"""
        application = self.get_object()
        
        if application.status != 'Offered':
            return ErrorResponse(message="No job offer to decline")
        
        application.status = 'Declined'
        application.save()
        
        return SuccessResponse(message="Job offer declined successfully")

    # Admin Actions
    @action(detail=True, methods=['post'], permission_classes=[IsPlacementTeam | IsAdminRole])
    def offer_job(self, request, pk=None):
        """POST /api/applications/1/offer_job/"""
        application = self.get_object()
        job_id = request.data.get('job_id')
        
        if not job_id:
            return ValidationErrorResponse({'job_id': 'This field is required'})
            
        if application.status != 'Applied':
            return ErrorResponse(message="Can only offer jobs to 'Applied' applications")
        
        application.status = 'Offered'
        application.save()
        
        return SuccessResponse(message="Job offered successfully")

    @action(detail=True, methods=['post'], permission_classes=[IsPlacementTeam | IsAdminRole])
    def reject(self, request, pk=None):
        """POST /api/applications/1/reject/"""
        application = self.get_object()
        
        if application.status not in ['Applied', 'Offered']:
            return ErrorResponse(message="Can only reject 'Applied' or 'Offered' applications")
        
        application.status = 'Rejected'
        application.save()
        
        return SuccessResponse(message="Application rejected successfully")