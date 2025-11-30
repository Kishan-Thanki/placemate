"""
NBA Success Index Calculator

Implements the precise calculation of NBA Success Index (SI) as per
Tier-I and Tier-II accreditation requirements.

Formula:
SI = (Number of students who graduated from the program in the stipulated period) /
     (Number of students admitted in the first year + Lateral Entry Admitted)
"""

from django.db.models import Q, Count, F
from django.utils import timezone
from apps.students.models import StudentProfile
from apps.core.models import Program


class NBASuccessCalculator:
    """
    Calculates NBA Success Index with proper cohort tracking.
    
    Handles:
    - Regular vs Lateral Entry distinction
    - Backlog ledger analysis
    - Graduation status tracking
    - Table B.3a generation for SAR
    """
    
    def calculate_success_index(self, batch_year, program_id=None):
        """
        Calculate Success Index for a specific batch and program.
        
        Args:
            batch_year: Year when students joined (e.g., 2020)
            program_id: Optional program filter
            
        Returns:
            dict: {
                'success_index': float,
                'total_cohort': int,
                'regular_admitted': int,
                'lateral_admitted': int,
                'graduated_on_time_no_backlog': int,
                'graduated_on_time_with_backlog': int,
                'not_graduated': int
            }
        """
        # Get cohort
        cohort = self._get_cohort(batch_year, program_id)
        
        # Separate regular and lateral entries
        regular_admitted = cohort.filter(entry_type='REGULAR').count()
        lateral_admitted = cohort.filter(entry_type='LATERAL').count()
        total_cohort = regular_admitted + lateral_admitted
        
        if total_cohort == 0:
            return {
                'success_index': 0.0,
                'total_cohort': 0,
                'regular_admitted': 0,
                'lateral_admitted': 0,
                'graduated_on_time_no_backlog': 0,
                'graduated_on_time_with_backlog': 0,
                'not_graduated': 0,
            }
        
        # Calculate graduates
        graduated_on_time_no_backlog = cohort.filter(
            graduation_status='ONTIME_NO_BACKLOG'
        ).count()
        
        graduated_on_time_with_backlog = cohort.filter(
            graduation_status='ONTIME_WITH_BACKLOG'
        ).count()
        
        not_graduated = cohort.filter(
            graduation_status__in=['PENDING', 'NOT_GRADUATED']
        ).count()
        
        # Success Index = (Graduated On Time Without Backlogs) / Total Cohort
        success_index = (graduated_on_time_no_backlog / total_cohort) * 100 if total_cohort > 0 else 0.0
        
        return {
            'success_index': round(success_index, 2),
            'total_cohort': total_cohort,
            'regular_admitted': regular_admitted,
            'lateral_admitted': lateral_admitted,
            'graduated_on_time_no_backlog': graduated_on_time_no_backlog,
            'graduated_on_time_with_backlog': graduated_on_time_with_backlog,
            'not_graduated': not_graduated,
        }
    
    def _get_cohort(self, batch_year, program_id=None):
        """Get student cohort for a batch year"""
        queryset = StudentProfile.objects.filter(joining_year=batch_year)
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        return queryset.select_related('program', 'user')
    
    def generate_sar_table_b3a(self, program_id, academic_years=3):
        """
        Generate NBA SAR Table B.3a (Student Performance).
        
        Returns data for Current Academic Year (CAY) and preceding years (CAYm1, CAYm2).
        
        Args:
            program_id: Program ID
            academic_years: Number of years to include (default 3)
            
        Returns:
            dict: Table B.3a data structure
        """
        current_year = timezone.now().year
        table_data = []
        
        for i in range(academic_years):
            year = current_year - i
            batch_year = year - 4  # Assuming 4-year program
            
            metrics = self.calculate_success_index(batch_year, program_id)
            
            # Get program details
            try:
                program = Program.objects.get(id=program_id)
            except Program.DoesNotExist:
                continue
            
            table_data.append({
                'academic_year': f"{year-1}-{str(year)[-2:]}",
                'batch_year': batch_year,
                'program_name': program.name,
                'program_abbreviation': program.abbreviation,
                'total_admitted': metrics['total_cohort'],
                'regular_admitted': metrics['regular_admitted'],
                'lateral_admitted': metrics['lateral_admitted'],
                'graduated_on_time_no_backlog': metrics['graduated_on_time_no_backlog'],
                'graduated_on_time_with_backlog': metrics['graduated_on_time_with_backlog'],
                'success_index': metrics['success_index'],
                'api': self._calculate_api(metrics),  # Academic Performance Index
            })
        
        return {
            'program_id': program_id,
            'table_data': table_data,
            'generated_at': timezone.now().isoformat(),
        }
    
    def _calculate_api(self, metrics):
        """
        Calculate Academic Performance Index (API).
        
        API = (Success Index + Placement Rate + Higher Studies Rate) / 3
        """
        # Simplified calculation - would need actual placement and higher studies data
        success_index = metrics['success_index']
        
        # Placeholder - would integrate with actual placement data
        placement_rate = 0.0
        higher_studies_rate = 0.0
        
        api = (success_index + placement_rate + higher_studies_rate) / 3
        return round(api, 2)
    
    def validate_backlog_ledger(self, student):
        """
        Validate and update student's graduation status based on backlog ledger.
        
        This ensures the graduation_status field accurately reflects the backlog history.
        """
        if not student.backlog_ledger:
            return
        
        # Check if student has any active backlogs
        has_active_backlogs = False
        has_cleared_backlogs = False
        
        for semester, subjects in student.backlog_ledger.items():
            if isinstance(subjects, dict):
                for subject, details in subjects.items():
                    if isinstance(details, dict):
                        clear_date = details.get('clear_date')
                        if not clear_date:
                            has_active_backlogs = True
                        else:
                            has_cleared_backlogs = True
        
        # Update graduation status based on backlog analysis
        # This is a simplified version - full implementation would check
        # graduation date against program duration
        if has_active_backlogs:
            student.graduation_status = 'PENDING'
        elif has_cleared_backlogs and not has_active_backlogs:
            student.graduation_status = 'ONTIME_WITH_BACKLOG'
        else:
            student.graduation_status = 'ONTIME_NO_BACKLOG'
        
        student.save(update_fields=['graduation_status'])

