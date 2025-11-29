"""
Dashboard Views for Analytics

Provides role-based dashboard endpoints for TPO, Students, and Admins.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.core.permissions import IsPlacementTeam, IsStudentRole, IsAdminRole
from apps.core.response import SuccessResponse
from apps.students.models import StudentProfile
from apps.analytics.services.tpo_dashboard_service import TPODashboardService
from apps.analytics.services.student_dashboard_service import StudentDashboardService
from apps.analytics.services.kpi_calculator import KPICalculator
from apps.analytics.services.nba_calculator import NBASuccessCalculator
from apps.analytics.services.nirf_calculator import NIRFCalculator
from apps.analytics.serializers import (
    TPODashboardOperationalSerializer,
    TPODashboardStrategicSerializer,
    StudentDashboardSerializer,
    AdminDashboardSerializer,
)


class TPODashboardView(APIView):
    """
    TPO Command Center Dashboard
    
    Provides dual-view dashboard:
    - Operational: Real-time metrics
    - Strategic: Season performance and compliance
    """
    permission_classes = [IsAuthenticated, IsPlacementTeam]
    
    def get(self, request):
        """
        GET /api/v1/analytics/tpo/dashboard/
        
        Query Parameters:
        - view: 'operational' or 'strategic' (default: both)
        - academic_year: Optional academic year filter
        """
        view_type = request.query_params.get('view', 'both')
        academic_year = request.query_params.get('academic_year', None)
        
        service = TPODashboardService()
        
        if view_type == 'operational':
            data = service.get_operational_view()
            serializer = TPODashboardOperationalSerializer(data)
        elif view_type == 'strategic':
            data = service.get_strategic_view(academic_year)
            serializer = TPODashboardStrategicSerializer(data)
        else:
            # Return both views
            operational = service.get_operational_view()
            strategic = service.get_strategic_view(academic_year)
            data = {
                'operational': operational,
                'strategic': strategic,
            }
            return SuccessResponse(
                data=data,
                message="TPO dashboard data retrieved successfully"
            )
        
        if serializer.is_valid(raise_exception=True):
            return SuccessResponse(
                data=serializer.validated_data,
                message="TPO dashboard data retrieved successfully"
            )


class StudentDashboardView(APIView):
    """
    Student Career Portal Dashboard
    
    Provides action-oriented dashboard for students.
    """
    permission_classes = [IsAuthenticated, IsStudentRole]
    
    def get(self, request):
        """
        GET /api/v1/analytics/student/dashboard/
        
        Returns personalized dashboard for the authenticated student.
        """
        try:
            student_profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            return SuccessResponse(
                data={},
                message="Student profile not found",
                success=False
            )
        
        service = StudentDashboardService()
        data = service.get_student_dashboard(student_profile)
        
        serializer = StudentDashboardSerializer(data)
        if serializer.is_valid(raise_exception=True):
            return SuccessResponse(
                data=serializer.validated_data,
                message="Student dashboard data retrieved successfully"
            )


class AdminDashboardView(APIView):
    """
    Admin Accreditation Dashboard
    
    Provides compliance-focused dashboard for institutional leadership.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
    
    def get(self, request):
        """
        GET /api/v1/analytics/admin/dashboard/
        
        Query Parameters:
        - academic_year: Optional academic year filter
        """
        academic_year = request.query_params.get('academic_year', None)
        
        kpi_calculator = KPICalculator()
        nba_calculator = NBASuccessCalculator()
        nirf_calculator = NIRFCalculator()
        
        # Institutional Performance
        institutional_performance = {
            'overall_placement_rate': kpi_calculator.calculate_placement_rate(academic_year),
            'average_package_ug': kpi_calculator.calculate_average_salary(degree_level='UG'),
            'average_package_pg': kpi_calculator.calculate_average_salary(degree_level='PG'),
            'year_over_year_growth': self._calculate_yoy_growth(kpi_calculator, academic_year),
        }
        
        # Program Analytics
        program_analytics = {
            'program_wise_placement': kpi_calculator.get_program_wise_placement(),
            'department_performance': kpi_calculator.get_department_performance(),
        }
        
        # Recruiter Insights
        recruiter_insights = {
            'recruiter_retention_rate': 0.0,  # TODO: Implement
            'new_recruiters': 0,  # TODO: Implement
            'company_conversion_rate': kpi_calculator.get_company_conversion_rate(academic_year),
        }
        
        # NBA Compliance
        current_year = 2024  # TODO: Get from academic_year
        batch_year = current_year - 4
        nba_compliance = {
            'current_batch_success_index': nba_calculator.calculate_success_index(batch_year),
            'sar_table_b3a_ready': True,
        }
        
        # NAAC Compliance
        naac_compliance = {
            'evidence_verification_status': self._get_naac_verification_status(),
            'data_template_ready': True,
        }
        
        # NIRF Metrics
        nirf_metrics = {
            'median_salary': nirf_calculator.calculate_median_salary(batch_year),
            'gph_metric': nirf_calculator.calculate_gph_metric(batch_year),
            'diversity_metrics': nirf_calculator.calculate_diversity_metrics(batch_year),
        }
        
        data = {
            'institutional_performance': institutional_performance,
            'program_analytics': program_analytics,
            'recruiter_insights': recruiter_insights,
            'nba_compliance': nba_compliance,
            'naac_compliance': naac_compliance,
            'nirf_metrics': nirf_metrics,
        }
        
        serializer = AdminDashboardSerializer(data)
        if serializer.is_valid(raise_exception=True):
            return SuccessResponse(
                data=serializer.validated_data,
                message="Admin dashboard data retrieved successfully"
            )
    
    def _calculate_yoy_growth(self, kpi_calculator, academic_year):
        """Calculate year-over-year growth"""
        from django.utils import timezone
        current_year = timezone.now().year
        previous_year = current_year - 1
        
        current_rate = kpi_calculator.calculate_placement_rate(
            academic_year=f"{current_year-1}-{str(current_year)[-2:]}"
        )
        previous_rate = kpi_calculator.calculate_placement_rate(
            academic_year=f"{previous_year-1}-{str(previous_year)[-2:]}"
        )
        
        change = current_rate - previous_rate
        change_percentage = (change / previous_rate * 100) if previous_rate > 0 else 0.0
        
        return {
            'current_year': current_rate,
            'previous_year': previous_rate,
            'change': round(change, 2),
            'change_percentage': round(change_percentage, 2),
        }
    
    def _get_naac_verification_status(self):
        """Get NAAC document verification status"""
        from apps.analytics.models.compliance_models import DocumentVerification
        
        total_docs = DocumentVerification.objects.count()
        verified_docs = DocumentVerification.objects.filter(
            verification_status='VERIFIED'
        ).count()
        
        return {
            'total_documents': total_docs,
            'verified_documents': verified_docs,
            'verification_percentage': round((verified_docs / total_docs * 100) if total_docs > 0 else 0, 2),
        }

