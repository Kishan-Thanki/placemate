from rest_framework import permissions
from apps.core.views import BaseViewSet
from rest_framework.decorators import action  
from apps.core.permissions import IsAdminRole, IsStudentRole, IsPlacementTeam
from .models import CompanyDriveApplication, JobPreference
from apps.placements.models import CompanyDrive, Job
from apps.students.models import StudentProfile
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.response import SuccessResponse, ForbiddenResponse,ErrorResponse, ValidationErrorResponse
from .serializers import (
    CompanyDriveApplicationCreateSerializer,
    CompanyDriveApplicationDetailSerializer,
    CompanyDriveApplicationBaseSerializer
)
from apps.core.tasks import send_email_in_background
from django.conf import settings
from django.utils import timezone

# Create your views here.
class CompanyDriveApplicationViewSet(BaseViewSet):
    
    queryset = CompanyDriveApplication.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company_drive', 'student', 'status']

    def get_permissions(self):
        """Only students can create applications"""
        if self.action == 'create':
            return [IsStudentRole()]
        return super().get_permissions()
    
    def get_serializer_context(self):
        """Add student_profile to serializer context"""
        context = super().get_serializer_context()
        
        # Add student_profile for student users
        if hasattr(self.request, "user") and self.request.user.is_authenticated:
            try:
                # Add student_profile for student users
                context['student_profile'] = StudentProfile.objects.get(user=self.request.user)
            except StudentProfile.DoesNotExist:
                context['student_profile'] = None

        return context

    def get_serializer_class(self):
        if self.action == 'create':
            return CompanyDriveApplicationCreateSerializer
        elif self.action == 'retrieve':
            return CompanyDriveApplicationDetailSerializer
        else:
            return CompanyDriveApplicationBaseSerializer  # For list views
        
    def get_queryset(self):
        """Secure queryset - users only see what they should"""
        queryset = CompanyDriveApplication.objects.all()
        
        # Students only see their own applications
        if hasattr(self.request.user, 'active_role') and self.request.user.active_role == 'Student':
            try:
                student_profile = StudentProfile.objects.get(user=self.request.user)
                queryset = queryset.filter(student=student_profile)
            except StudentProfile.DoesNotExist:
                return CompanyDriveApplication.objects.none()
        
        return queryset.select_related(
            'student__user',
            'company_drive__company',
            'company_drive__placement_drive',
            'offered_job'
        ).prefetch_related('job_preferences__job')

    
    def perform_create(self, serializer):
        """Auto-assign student profile during creation"""
        # Student profile is already in context and validated by serializer
        serializer.save()

    # Student Actions
    @action(detail=True, methods=['post'], permission_classes=[IsStudentRole])
    def withdraw(self, request, pk=None):
        """POST /api/applications/1/withdraw/"""
        application = self.get_object()
        
        if application.status != 'Applied':
            return ErrorResponse(message="Can only withdraw 'Applied' applications")
        
        company_drive = application.company_drive

        if company_drive.status!= 'Open':
            return ErrorResponse(message="Cannot withdraw: The company drive is closed.")
        
        if company_drive.application_deadline < timezone.now():
            return ErrorResponse(message="Cannot withdraw: The application deadline for this drive has already passed.")
        
        try:
            application.delete()
        except Exception as e:
            return ErrorResponse(message=f"An error occurred while deleting the application: {e}")

        return SuccessResponse(message="Application withdrawn successfully")

    @action(detail=True, methods=['post'], permission_classes=[IsStudentRole])
    def accept_offer(self, request, pk=None):
        """POST /api/applications/1/accept_offer/"""
        application = self.get_object()
        
        if application.status != 'Offered':
            return ErrorResponse(message="No job offer to accept")
        
        application.status = 'Accepted'
        application.save()

        send_email_in_background(
            subject=f"Offer Accepted - {application.offered_job.title} at {application.company_drive.company.name}",
            template_name="emails/offer_accepted.html",
            context={
                'student_name': application.student.user.get_full_name(),
                'company_name': application.company_drive.company.name,
                'job_title': application.offered_job.title,
                'job_type': application.offered_job.company_drive.drive_type,
                'job_mode': application.offered_job.company_drive.job_mode,
                'package_range': f"₹{application.offered_job.ug_package_min} - ₹{application.offered_job.ug_package_max} LPA" if application.offered_job.ug_package_min else "As per company standards",
                'next_steps': [
                    "Wait for further communication from the company",
                    "Keep your documents ready for verification",
                    "The placement team will guide you through the next process"
                ],
                'placement_contact_email': "placemate.org@gmail.com", 
            },
            recipient_list=[application.student.user.email]
        )
        
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
        
        try:
            job = Job.objects.get(id=job_id)

            
            if job.company_drive != application.company_drive:
                return ValidationErrorResponse({
                    'job_id': f'Job "{job.title}" does not belong to {application.company_drive.company.name} drive'
                })
        except Job.DoesNotExist:
            return ValidationErrorResponse({'job_id': 'Job not found'})
        

        if application.status != 'Applied':
            return ErrorResponse(message="Can only offer jobs to 'Applied' applications")
        
        application.status = 'Offered'
        application.offered_job = job
        application.save()


        send_email_in_background(
            subject=f"Job Offer from {application.company_drive.company.name}",
            template_name="emails/job_offer.html",
            context={
                'student_name': application.student.user.get_full_name(),
                'company_name': application.company_drive.company.name,
                'job_title': job.title,
                'job_type': job.company_drive.drive_type,
                'job_mode': job.company_drive.job_mode,
                'package_range': f"₹{job.ug_package_min} - ₹{job.ug_package_max} LPA" if job.ug_package_min else "As per company standards",
                'accept_deadline': "48 hours",  # You can make this dynamic
                'drive_title': application.company_drive.placement_drive.title,
                'placement_portal_url': settings.FRONTEND_URL
            },
            recipient_list=[application.student.user.email]
        )
        
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