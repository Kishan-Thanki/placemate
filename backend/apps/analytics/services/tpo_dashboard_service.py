"""
TPO Dashboard Service

Provides dual-view dashboard data:
1. Operational View: Real-time metrics for day-to-day operations
2. Strategic View: Season performance and compliance metrics
"""

from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import timedelta
from apps.placements.models import CompanyDrive, Job
from apps.applications.models import CompanyDriveApplication
from apps.analytics.models.compliance_models import PlacementOffer, DocumentVerification
from apps.students.models import StudentProfile
from .kpi_calculator import KPICalculator
from .nba_calculator import NBASuccessCalculator
from .nirf_calculator import NIRFCalculator


class TPODashboardService:
    """
    Service for TPO Command Center dashboard.
    Provides both operational and strategic views.
    """
    
    def __init__(self):
        self.kpi_calculator = KPICalculator()
        self.nba_calculator = NBASuccessCalculator()
        self.nirf_calculator = NIRFCalculator()
    
    def get_operational_view(self):
        """
        Real-time operational metrics for TPO.
        
        Returns:
            dict: Operational dashboard data
        """
        today = timezone.now().date()
        
        # Today's interviews (placeholder - would need interview scheduling model)
        today_interviews = 0  # TODO: Implement interview tracking
        
        # Pending applications
        pending_applications = CompanyDriveApplication.objects.filter(
            status='Applied'
        ).count()
        
        # Upcoming deadlines (next 7 days)
        upcoming_deadlines = CompanyDriveApplication.objects.filter(
            company_drive__application_deadline__gte=today,
            company_drive__application_deadline__lte=today + timedelta(days=7)
        ).count()
        
        # Active drives
        active_drives = CompanyDrive.objects.filter(status='Open').count()
        
        # Red flags
        red_flags = self._get_red_flags()
        
        # Recent notifications (last 10)
        recent_notifications = self._get_recent_notifications()
        
        # Drive pipeline (Kanban status)
        drive_pipeline = self._get_drive_pipeline()
        
        return {
            'today_interviews': today_interviews,
            'pending_applications': pending_applications,
            'upcoming_deadlines': upcoming_deadlines,
            'active_drives': active_drives,
            'red_flags': red_flags,
            'recent_notifications': recent_notifications,
            'drive_pipeline': drive_pipeline,
            'last_updated': timezone.now().isoformat(),
        }
    
    def get_strategic_view(self, academic_year=None):
        """
        Strategic performance metrics for TPO.
        
        Returns:
            dict: Strategic dashboard data
        """
        # Season placement rate
        season_placement_rate = self.kpi_calculator.calculate_placement_rate(academic_year)
        
        # Average salary
        average_salary = self.kpi_calculator.calculate_average_salary()
        
        # Company conversion rate
        company_conversion_rate = self.kpi_calculator.get_company_conversion_rate(academic_year)
        
        # Department performance
        department_performance = self.kpi_calculator.get_department_performance()
        
        # Completion rate
        total_drives = CompanyDrive.objects.count()
        completed_drives = CompanyDrive.objects.filter(status='Closed').count()
        completion_rate = (completed_drives / total_drives * 100) if total_drives > 0 else 0.0
        
        # Year-over-year comparison
        yoy_comparison = self._get_yoy_comparison()
        
        # NBA compliance status
        nba_status = self._get_nba_compliance_status()
        
        # NIRF metrics
        nirf_metrics = self._get_nirf_metrics()
        
        return {
            'season_placement_rate': season_placement_rate,
            'average_salary': average_salary,
            'company_conversion_rate': company_conversion_rate,
            'department_performance': department_performance,
            'completion_rate': round(completion_rate, 2),
            'yoy_comparison': yoy_comparison,
            'nba_compliance_status': nba_status,
            'nirf_metrics': nirf_metrics,
            'last_updated': timezone.now().isoformat(),
        }
    
    def _get_red_flags(self):
        """
        Get critical alerts requiring immediate attention.
        
        Returns:
            list: Red flag alerts
        """
        flags = []
        
        # Unverified offers
        unverified_offers = PlacementOffer.objects.filter(
            is_verified=False,
            offer_date__lte=timezone.now().date() - timedelta(days=3)
        ).count()
        
        if unverified_offers > 0:
            flags.append({
                'type': 'unverified_offers',
                'message': f'{unverified_offers} offers pending verification',
                'priority': 'high',
                'action_url': '/api/v1/analytics/offers/unverified/',
            })
        
        # Pending document verifications
        pending_docs = DocumentVerification.objects.filter(
            verification_status='PENDING'
        ).count()
        
        if pending_docs > 10:
            flags.append({
                'type': 'pending_documents',
                'message': f'{pending_docs} documents pending verification',
                'priority': 'medium',
                'action_url': '/api/v1/analytics/documents/pending/',
            })
        
        # Companies with no activity
        stale_drives = CompanyDrive.objects.filter(
            status='Open',
            created_at__lt=timezone.now() - timedelta(days=30)
        ).count()
        
        if stale_drives > 0:
            flags.append({
                'type': 'stale_drives',
                'message': f'{stale_drives} drives with no recent activity',
                'priority': 'low',
                'action_url': '/api/v1/placements/company-drives/?status=Open',
            })
        
        return flags
    
    def _get_recent_notifications(self, limit=10):
        """
        Get recent system notifications.
        
        Returns:
            list: Recent notifications
        """
        # Placeholder - would integrate with notification system
        return []
    
    def _get_drive_pipeline(self):
        """
        Get drive pipeline status (Kanban board data).
        
        Returns:
            dict: Drive pipeline by status
        """
        # Simplified pipeline stages
        total_drives = CompanyDrive.objects.count()
        open_drives = CompanyDrive.objects.filter(status='Open').count()
        closed_drives = CompanyDrive.objects.filter(status='Closed').count()
        
        return {
            'total': total_drives,
            'open': open_drives,
            'closed': closed_drives,
            'stages': {
                'leads': 0,  # TODO: Implement lead tracking
                'contacted': 0,
                'jaf_received': 0,
                'scheduled': 0,
                'interviews': 0,
                'results': closed_drives,
            }
        }
    
    def _get_yoy_comparison(self):
        """
        Get year-over-year comparison.
        
        Returns:
            dict: YoY metrics
        """
        current_year = timezone.now().year
        previous_year = current_year - 1
        
        current_placement_rate = self.kpi_calculator.calculate_placement_rate(
            academic_year=f"{current_year-1}-{str(current_year)[-2:]}"
        )
        
        previous_placement_rate = self.kpi_calculator.calculate_placement_rate(
            academic_year=f"{previous_year-1}-{str(previous_year)[-2:]}"
        )
        
        change = current_placement_rate - previous_placement_rate
        change_percentage = (change / previous_placement_rate * 100) if previous_placement_rate > 0 else 0.0
        
        return {
            'current_year': current_placement_rate,
            'previous_year': previous_placement_rate,
            'change': round(change, 2),
            'change_percentage': round(change_percentage, 2),
            'trend': 'up' if change > 0 else 'down',
        }
    
    def _get_nba_compliance_status(self):
        """
        Get NBA compliance status summary.
        
        Returns:
            dict: NBA compliance metrics
        """
        # Get current batch
        current_year = timezone.now().year
        batch_year = current_year - 4  # Assuming 4-year program
        
        # Calculate Success Index for all programs
        from apps.core.models import Program
        programs = Program.objects.all()
        
        nba_status = []
        for program in programs:
            metrics = self.nba_calculator.calculate_success_index(batch_year, program.id)
            nba_status.append({
                'program_name': program.name,
                'success_index': metrics['success_index'],
                'total_cohort': metrics['total_cohort'],
                'graduated_on_time_no_backlog': metrics['graduated_on_time_no_backlog'],
            })
        
        return {
            'batch_year': batch_year,
            'program_status': nba_status,
        }
    
    def _get_nirf_metrics(self):
        """
        Get NIRF metrics summary.
        
        Returns:
            dict: NIRF metrics
        """
        current_year = timezone.now().year
        batch_year = current_year - 4
        
        median_salary = self.nirf_calculator.calculate_median_salary(batch_year)
        gph_metric = self.nirf_calculator.calculate_gph_metric(batch_year)
        
        return {
            'median_salary': median_salary['median_salary'],
            'gph_percentage': gph_metric['gph_percentage'],
            'total_placed': median_salary['total_placed'],
        }

