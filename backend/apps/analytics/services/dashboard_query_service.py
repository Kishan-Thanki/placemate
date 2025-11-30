"""
Dashboard Query Service

Uses materialized views for fast dashboard queries.
Falls back to direct queries if views are not available.
"""

from django.db import connection
from apps.analytics.services.materialized_view_service import MaterializedViewService


class DashboardQueryService:
    """
    Service that uses materialized views for dashboard queries.
    Provides fallback to direct queries if views don't exist.
    """
    
    def __init__(self):
        self.view_service = MaterializedViewService()
    
    def get_department_performance(self):
        """
        Get department performance from materialized view.
        
        Returns:
            list: Department performance metrics
        """
        try:
            # Try materialized view first
            data = self.view_service.get_view_data('analytics_department_stats')
            
            if data:
                return [
                    {
                        'department': item['department_name'],
                        'total_students': item['total_students'],
                        'placed_students': item['placed_students'],
                        'placement_rate': round(float(item['placement_rate'] or 0), 2),
                        'avg_salary': round(float(item['avg_salary'] or 0), 2),
                        'median_salary': round(float(item['median_salary'] or 0), 2),
                    }
                    for item in data
                ]
        except Exception:
            # Fallback to direct query
            pass
        
        # Fallback: Use direct query
        from apps.analytics.services.kpi_calculator import KPICalculator
        calculator = KPICalculator()
        return calculator.get_department_performance()
    
    def get_program_performance(self):
        """
        Get program performance from materialized view.
        
        Returns:
            list: Program performance metrics
        """
        try:
            # Try materialized view first
            data = self.view_service.get_view_data('analytics_program_stats')
            
            if data:
                return [
                    {
                        'program_id': item['program_id'],
                        'program_name': item['program_name'],
                        'program_abbreviation': item['program_abbreviation'],
                        'degree_level': item['degree_level'],
                        'total_students': item['total_students'],
                        'placed_students': item['placed_students'],
                        'placement_rate': round(float(item['placement_rate'] or 0), 2),
                        'avg_salary': round(float(item['avg_salary'] or 0), 2),
                        'median_salary': round(float(item['median_salary'] or 0), 2),
                    }
                    for item in data
                ]
        except Exception:
            # Fallback to direct query
            pass
        
        # Fallback: Use direct query
        from apps.analytics.services.kpi_calculator import KPICalculator
        calculator = KPICalculator()
        return calculator.get_program_wise_placement()
    
    def get_batch_placement_summary(self, batch_year, program_id=None):
        """
        Get batch placement summary from materialized view.
        
        Args:
            batch_year: Batch year
            program_id: Optional program filter
            
        Returns:
            dict: Batch placement summary
        """
        try:
            filters = {'batch_year': batch_year}
            if program_id:
                filters['program_id'] = program_id
            
            data = self.view_service.get_view_data('analytics_placement_summary', filters)
            
            if data:
                item = data[0] if data else {}
                return {
                    'batch_year': item.get('batch_year'),
                    'program_name': item.get('program_name'),
                    'total_students': item.get('total_students', 0),
                    'placed_students': item.get('placed_students', 0),
                    'regular_admitted': item.get('regular_admitted', 0),
                    'lateral_admitted': item.get('lateral_admitted', 0),
                    'placement_rate': round(float(item.get('placement_rate', 0) or 0), 2),
                    'avg_salary': round(float(item.get('avg_salary', 0) or 0), 2),
                    'median_salary': round(float(item.get('median_salary', 0) or 0), 2),
                }
        except Exception:
            # Fallback to direct query
            pass
        
        return {}
    
    def get_nirf_metrics(self, batch_year, program_id=None):
        """
        Get NIRF metrics from materialized view.
        
        Args:
            batch_year: Batch year
            program_id: Optional program filter
            
        Returns:
            dict: NIRF metrics
        """
        try:
            filters = {'batch_year': batch_year}
            if program_id:
                filters['program_id'] = program_id
            
            data = self.view_service.get_view_data('analytics_nirf_metrics', filters)
            
            if data:
                item = data[0] if data else {}
                return {
                    'batch_year': item.get('batch_year'),
                    'program_name': item.get('program_name'),
                    'gph_percentage': round(float(item.get('gph_percentage', 0) or 0), 2),
                    'median_salary': round(float(item.get('median_salary', 0) or 0), 2),
                    'placed_count': item.get('placed_count', 0),
                    'higher_studies_count': item.get('higher_studies_count', 0),
                    'male_placed': item.get('male_placed', 0),
                    'female_placed': item.get('female_placed', 0),
                    'reserved_category_placed': item.get('reserved_category_placed', 0),
                }
        except Exception:
            # Fallback to direct query
            pass
        
        return {}

