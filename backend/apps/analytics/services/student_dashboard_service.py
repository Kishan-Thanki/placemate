"""
Student Dashboard Service

Provides action-oriented dashboard data for students.
"""

from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from apps.applications.models import CompanyDriveApplication
from apps.placements.models import CompanyDrive, Job
from apps.students.models import StudentProfile


class StudentDashboardService:
    """
    Service for Student Career Portal dashboard.
    Focuses on clarity and actionable insights.
    """
    
    def get_student_dashboard(self, student_profile):
        """
        Get complete dashboard data for a student.
        
        Args:
            student_profile: StudentProfile instance
            
        Returns:
            dict: Student dashboard data
        """
        # Application status
        application_status = self._get_application_status(student_profile)
        
        # Upcoming tasks
        upcoming_tasks = self._get_upcoming_tasks(student_profile)
        
        # Profile completeness
        profile_completeness = self._calculate_profile_completeness(student_profile)
        
        # Eligibility meter
        eligibility_meter = self._get_eligibility_meter(student_profile)
        
        # Application status rail
        application_rail = self._get_application_rail(student_profile)
        
        return {
            'application_status': application_status,
            'upcoming_tasks': upcoming_tasks,
            'profile_completeness': profile_completeness,
            'eligibility_meter': eligibility_meter,
            'application_rail': application_rail,
            'last_updated': timezone.now().isoformat(),
        }
    
    def _get_application_status(self, student_profile):
        """
        Get application status breakdown.
        
        Returns:
            dict: Application status counts
        """
        applications = CompanyDriveApplication.objects.filter(student=student_profile)
        
        return {
            'applied': applications.filter(status='Applied').count(),
            'interview': applications.filter(status__in=['Applied', 'Offered']).count(),
            'offered': applications.filter(status='Offered').count(),
            'rejected': applications.filter(status='Rejected').count(),
            'accepted': applications.filter(status='Accepted').count(),
            'withdrawn': applications.filter(status='Withdrawn').count(),
            'total': applications.count(),
        }
    
    def _get_upcoming_tasks(self, student_profile):
        """
        Get upcoming tasks requiring student action.
        
        Returns:
            list: Upcoming tasks
        """
        tasks = []
        
        # Pending applications needing action
        pending_applications = CompanyDriveApplication.objects.filter(
            student=student_profile,
            status='Applied'
        ).count()
        
        if pending_applications > 0:
            tasks.append({
                'type': 'pending_applications',
                'message': f'{pending_applications} applications pending review',
                'action_url': '/api/v1/applications/?status=Applied',
                'priority': 'medium',
            })
        
        # Approaching deadlines
        today = timezone.now().date()
        upcoming_deadlines = CompanyDriveApplication.objects.filter(
            student=student_profile,
            company_drive__application_deadline__gte=today,
            company_drive__application_deadline__lte=today + timedelta(days=7),
            company_drive__status='Open'
        ).count()
        
        if upcoming_deadlines > 0:
            tasks.append({
                'type': 'approaching_deadlines',
                'message': f'{upcoming_deadlines} drives closing soon',
                'action_url': '/api/v1/placements/company-drives/?status=Open',
                'priority': 'high',
            })
        
        # Offers pending acceptance
        pending_offers = CompanyDriveApplication.objects.filter(
            student=student_profile,
            status='Offered'
        ).count()
        
        if pending_offers > 0:
            tasks.append({
                'type': 'pending_offers',
                'message': f'{pending_offers} job offer(s) pending your response',
                'action_url': '/api/v1/applications/?status=Offered',
                'priority': 'high',
            })
        
        return tasks
    
    def _calculate_profile_completeness(self, student_profile):
        """
        Calculate profile completeness percentage.
        
        Returns:
            dict: Profile completeness metrics
        """
        required_fields = [
            'current_cgpa',
            'tenth_percentage',
            'twelfth_percentage',
            'date_of_birth',
            'gender',
            'address_line1',
            'city',
        ]
        
        completed_fields = 0
        missing_fields = []
        
        for field in required_fields:
            value = getattr(student_profile, field, None)
            if value:
                completed_fields += 1
            else:
                missing_fields.append(field.replace('_', ' ').title())
        
        total_fields = len(required_fields)
        completeness_percentage = (completed_fields / total_fields) * 100
        
        return {
            'percentage': round(completeness_percentage, 2),
            'completed_fields': completed_fields,
            'total_fields': total_fields,
            'missing_fields': missing_fields,
        }
    
    def _get_eligibility_meter(self, student_profile):
        """
        Calculate eligibility percentage for upcoming drives.
        
        Returns:
            dict: Eligibility metrics
        """
        # Get all open drives
        open_drives = CompanyDrive.objects.filter(status='Open')
        
        if not open_drives.exists():
            return {
                'eligible_percentage': 0.0,
                'total_drives': 0,
                'eligible_drives': 0,
                'ineligible_reasons': [],
            }
        
        eligible_count = 0
        ineligible_reasons = []
        
        for drive in open_drives:
            # Check eligibility for each job in the drive
            jobs = drive.jobs.all()
            is_eligible = False
            
            for job in jobs:
                # Check CGPA
                if job.min_ug_cgpa and student_profile.current_cgpa:
                    if student_profile.current_cgpa < job.min_ug_cgpa:
                        ineligible_reasons.append(f"CGPA requirement: {job.min_ug_cgpa}")
                        continue
                
                # Check backlogs
                if job.max_active_backlogs is not None:
                    if student_profile.active_backlogs > job.max_active_backlogs:
                        ineligible_reasons.append(f"Active backlogs: {student_profile.active_backlogs}")
                        continue
                
                # Check program eligibility
                if job.eligible_programs.exists():
                    if student_profile.program not in job.eligible_programs.all():
                        ineligible_reasons.append(f"Program not eligible")
                        continue
                
                is_eligible = True
                break
            
            if is_eligible:
                eligible_count += 1
        
        total_drives = open_drives.count()
        eligible_percentage = (eligible_count / total_drives * 100) if total_drives > 0 else 0.0
        
        return {
            'eligible_percentage': round(eligible_percentage, 2),
            'total_drives': total_drives,
            'eligible_drives': eligible_count,
            'ineligible_reasons': list(set(ineligible_reasons))[:5],  # Top 5 reasons
        }
    
    def _get_application_rail(self, student_profile):
        """
        Get application status rail (linear progress for each application).
        
        Returns:
            list: Application status rails
        """
        applications = CompanyDriveApplication.objects.filter(
            student=student_profile
        ).select_related('company_drive', 'company_drive__company', 'offered_job')
        
        rails = []
        for app in applications:
            # Determine current stage
            stages = ['Applied', 'Shortlisted', 'Interview', 'Offer']
            current_stage_index = 0
            
            if app.status == 'Offered' or app.status == 'Accepted':
                current_stage_index = 3
            elif app.status == 'Rejected':
                current_stage_index = -1  # Failed
            elif app.status == 'Applied':
                current_stage_index = 0
            
            rails.append({
                'application_id': app.id,
                'company_name': app.company_drive.company.name,
                'drive_title': app.company_drive.placement_drive.title,
                'status': app.status,
                'current_stage': stages[current_stage_index] if current_stage_index >= 0 else 'Rejected',
                'stages': stages,
                'current_stage_index': current_stage_index,
                'applied_at': app.applied_at.isoformat(),
            })
        
        return rails

