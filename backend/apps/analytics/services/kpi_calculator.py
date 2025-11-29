"""
KPI Calculator Service

Provides standardized KPI calculations for dashboards.
"""

from django.db.models import Count, Avg, Q, F, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from apps.students.models import StudentProfile
from apps.placements.models import CompanyDrive, Job
from apps.applications.models import CompanyDriveApplication
from apps.analytics.models.compliance_models import PlacementOffer


class KPICalculator:
    """
    Centralized KPI calculation service.
    All dashboard metrics use this service for consistency.
    """
    
    def calculate_placement_rate(self, academic_year=None, program_id=None):
        """
        Calculate overall placement rate.
        
        Args:
            academic_year: Optional academic year filter
            program_id: Optional program filter
            
        Returns:
            float: Placement rate percentage
        """
        queryset = StudentProfile.objects.all()
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        # Filter by academic year if provided
        if academic_year:
            # Assuming academic year format like "2023-24"
            batch_year = int(academic_year.split('-')[0]) - 4
            queryset = queryset.filter(joining_year=batch_year)
        
        total_eligible = queryset.count()
        placed_count = queryset.filter(is_placed=True).count()
        
        if total_eligible == 0:
            return 0.0
        
        return round((placed_count / total_eligible) * 100, 2)
    
    def get_department_performance(self, use_materialized_view=True):
        """
        Calculate department-wise placement performance.
        
        Args:
            use_materialized_view: Try to use materialized view first (default: True)
        
        Returns:
            list: Department performance metrics
        """
        # Try materialized view first if enabled
        if use_materialized_view:
            try:
                from apps.analytics.services.dashboard_query_service import DashboardQueryService
                query_service = DashboardQueryService()
                return query_service.get_department_performance()
            except Exception:
                # Fallback to direct query
                pass
        
        # Direct query fallback
        from apps.core.models import Program
        
        departments = Program.objects.values('degree__name').annotate(
            total_students=Count('studentprofile'),
            placed_students=Count('studentprofile', filter=Q(studentprofile__is_placed=True)),
        )
        
        result = []
        for dept in departments:
            total = dept['total_students']
            placed = dept['placed_students']
            placement_rate = (placed / total * 100) if total > 0 else 0.0
            
            result.append({
                'department': dept['degree__name'],
                'total_students': total,
                'placed_students': placed,
                'placement_rate': round(placement_rate, 2),
            })
        
        return sorted(result, key=lambda x: x['placement_rate'], reverse=True)
    
    def get_program_wise_placement(self):
        """
        Calculate program-wise placement rates.
        
        Returns:
            list: Program performance metrics
        """
        from apps.core.models import Program
        
        programs = Program.objects.annotate(
            total_students=Count('studentprofile'),
            placed_students=Count('studentprofile', filter=Q(studentprofile__is_placed=True)),
        ).select_related('degree')
        
        result = []
        for program in programs:
            total = program.total_students
            placed = program.placed_students
            placement_rate = (placed / total * 100) if total > 0 else 0.0
            
            result.append({
                'program_id': program.id,
                'program_name': program.name,
                'program_abbreviation': program.abbreviation,
                'degree_level': program.degree_level,
                'total_students': total,
                'placed_students': placed,
                'placement_rate': round(placement_rate, 2),
            })
        
        return sorted(result, key=lambda x: x['placement_rate'], reverse=True)
    
    def calculate_average_salary(self, program_id=None, degree_level=None):
        """
        Calculate average salary (for internal reporting).
        Note: NIRF uses median, not average.
        
        Returns:
            float: Average salary in LPA
        """
        queryset = PlacementOffer.objects.filter(
            outcome_type='PLACEMENT',
            is_verified=True
        )
        
        if program_id:
            queryset = queryset.filter(student__program_id=program_id)
        
        if degree_level:
            queryset = queryset.filter(student__program__degree_level=degree_level)
        
        avg_salary = queryset.aggregate(
            avg=Avg('total_ctc')
        )['avg']
        
        return round(float(avg_salary or 0), 2)
    
    def get_company_conversion_rate(self, academic_year=None):
        """
        Calculate company conversion rate.
        
        Returns:
            float: Percentage of companies that made offers
        """
        total_companies = CompanyDrive.objects.count()
        
        companies_with_offers = CompanyDrive.objects.filter(
            applications__status='Offered'
        ).distinct().count()
        
        if total_companies == 0:
            return 0.0
        
        return round((companies_with_offers / total_companies) * 100, 2)
    
    def get_unplaced_eligible_students(self, program_id=None):
        """
        Get count of eligible but unplaced students.
        
        Returns:
            int: Count of unplaced eligible students
        """
        queryset = StudentProfile.objects.filter(
            is_placed=False,
            is_verified=True
        )
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        # Filter for eligible students (good CGPA, no active backlogs)
        eligible = queryset.filter(
            current_cgpa__gte=7.0,
            active_backlogs=0
        )
        
        return eligible.count()
    
    def get_season_summary(self, academic_year=None):
        """
        Get overall season summary statistics.
        
        Returns:
            dict: Season summary metrics
        """
        total_students = StudentProfile.objects.count()
        placed_students = StudentProfile.objects.filter(is_placed=True).count()
        placement_rate = self.calculate_placement_rate(academic_year)
        
        avg_salary = self.calculate_average_salary()
        
        total_drives = CompanyDrive.objects.count()
        active_drives = CompanyDrive.objects.filter(status='Open').count()
        
        total_applications = CompanyDriveApplication.objects.count()
        pending_applications = CompanyDriveApplication.objects.filter(
            status='Applied'
        ).count()
        
        return {
            'total_students': total_students,
            'placed_students': placed_students,
            'placement_rate': placement_rate,
            'average_salary': avg_salary,
            'total_drives': total_drives,
            'active_drives': active_drives,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
        }

