"""
Materialized View Service

Manages PostgreSQL materialized views for dashboard performance optimization.
"""

from django.db import connection
from django.utils import timezone
from apps.analytics.models.dashboard_models import MaterializedViewConfig


class MaterializedViewService:
    """
    Service for creating, refreshing, and managing PostgreSQL materialized views.
    
    Materialized views pre-calculate expensive aggregations, allowing
    dashboards to query simple tables instead of complex joins.
    """
    
    def __init__(self):
        self.views = {
            'analytics_department_stats': self._get_department_stats_sql(),
            'analytics_program_stats': self._get_program_stats_sql(),
            'analytics_placement_summary': self._get_placement_summary_sql(),
            'analytics_nirf_metrics': self._get_nirf_metrics_sql(),
        }
    
    def create_all_views(self):
        """
        Create all materialized views defined in the system.
        
        Returns:
            dict: Creation results
        """
        results = {}
        
        for view_name, sql in self.views.items():
            try:
                self.create_view(view_name, sql)
                results[view_name] = {'status': 'created', 'error': None}
            except Exception as e:
                results[view_name] = {'status': 'error', 'error': str(e)}
        
        return results
    
    def create_view(self, view_name, sql_definition):
        """
        Create a materialized view.
        
        Args:
            view_name: Name of the view
            sql_definition: SQL CREATE MATERIALIZED VIEW statement
            
        Raises:
            Exception: If view creation fails
        """
        with connection.cursor() as cursor:
            # Drop if exists
            cursor.execute(f"DROP MATERIALIZED VIEW IF EXISTS {view_name};")
            
            # Create view
            cursor.execute(sql_definition)
            
            # Create indexes for performance
            self._create_view_indexes(cursor, view_name)
            
            # Update or create config
            MaterializedViewConfig.objects.update_or_create(
                view_name=view_name,
                defaults={
                    'sql_definition': sql_definition,
                    'last_refreshed_at': timezone.now(),
                }
            )
    
    def refresh_view(self, view_name):
        """
        Refresh a materialized view.
        
        Args:
            view_name: Name of the view to refresh
            
        Returns:
            bool: True if successful
        """
        with connection.cursor() as cursor:
            try:
                cursor.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view_name};")
                
                # Update refresh timestamp
                MaterializedViewConfig.objects.filter(view_name=view_name).update(
                    last_refreshed_at=timezone.now()
                )
                
                return True
            except Exception as e:
                # If CONCURRENTLY fails (no unique index), use regular refresh
                try:
                    cursor.execute(f"REFRESH MATERIALIZED VIEW {view_name};")
                    MaterializedViewConfig.objects.filter(view_name=view_name).update(
                        last_refreshed_at=timezone.now()
                    )
                    return True
                except Exception as e2:
                    print(f"Error refreshing {view_name}: {str(e2)}")
                    return False
    
    def refresh_all_views(self):
        """
        Refresh all materialized views.
        
        Returns:
            dict: Refresh results
        """
        results = {}
        
        for view_name in self.views.keys():
            success = self.refresh_view(view_name)
            results[view_name] = {
                'status': 'refreshed' if success else 'error',
                'refreshed_at': timezone.now().isoformat() if success else None
            }
        
        return results
    
    def drop_view(self, view_name):
        """
        Drop a materialized view.
        
        Args:
            view_name: Name of the view to drop
        """
        with connection.cursor() as cursor:
            cursor.execute(f"DROP MATERIALIZED VIEW IF EXISTS {view_name};")
        
        MaterializedViewConfig.objects.filter(view_name=view_name).delete()
    
    def _create_view_indexes(self, cursor, view_name):
        """
        Create indexes on materialized view for performance.
        
        Args:
            cursor: Database cursor
            view_name: Name of the view
        """
        index_definitions = {
            'analytics_department_stats': [
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_dept_stats_dept ON analytics_department_stats(department_id);",
                "CREATE INDEX IF NOT EXISTS idx_dept_stats_placement ON analytics_department_stats(placement_rate);",
            ],
            'analytics_program_stats': [
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_prog_stats_prog ON analytics_program_stats(program_id);",
                "CREATE INDEX IF NOT EXISTS idx_prog_stats_placement ON analytics_program_stats(placement_rate);",
            ],
            'analytics_placement_summary': [
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_placement_summary_batch ON analytics_placement_summary(batch_year, program_id);",
            ],
            'analytics_nirf_metrics': [
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_nirf_metrics_batch ON analytics_nirf_metrics(batch_year, program_id);",
            ],
        }
        
        if view_name in index_definitions:
            for index_sql in index_definitions[view_name]:
                try:
                    cursor.execute(index_sql)
                except Exception as e:
                    # Index might already exist, continue
                    pass
    
    def _get_department_stats_sql(self):
        """
        SQL for department-wise placement statistics.
        
        Returns:
            str: CREATE MATERIALIZED VIEW SQL
        """
        return """
        CREATE MATERIALIZED VIEW analytics_department_stats AS
        SELECT 
            d.id as department_id,
            d.name as department_name,
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END) as placed_students,
            CASE 
                WHEN COUNT(DISTINCT s.id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END)::FLOAT / COUNT(DISTINCT s.id)::FLOAT * 100)
                ELSE 0
            END as placement_rate,
            AVG(CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as avg_salary,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as median_salary,
            MAX(CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as max_salary,
            MIN(CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as min_salary
        FROM core_degree d
        LEFT JOIN core_program p ON p.degree_id = d.id
        LEFT JOIN students_studentprofile s ON s.program_id = p.id
        LEFT JOIN analytics_placementoffer po ON po.student_id = s.id AND po.outcome_type = 'PLACEMENT' AND po.is_verified = TRUE
        GROUP BY d.id, d.name;
        """
    
    def _get_program_stats_sql(self):
        """
        SQL for program-wise placement statistics.
        
        Returns:
            str: CREATE MATERIALIZED VIEW SQL
        """
        return """
        CREATE MATERIALIZED VIEW analytics_program_stats AS
        SELECT 
            p.id as program_id,
            p.name as program_name,
            p.abbreviation as program_abbreviation,
            p.degree_level,
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END) as placed_students,
            CASE 
                WHEN COUNT(DISTINCT s.id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END)::FLOAT / COUNT(DISTINCT s.id)::FLOAT * 100)
                ELSE 0
            END as placement_rate,
            AVG(CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as avg_salary,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as median_salary,
            COUNT(DISTINCT CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN s.id END) as placed_with_salary
        FROM core_program p
        LEFT JOIN students_studentprofile s ON s.program_id = p.id
        LEFT JOIN analytics_placementoffer po ON po.student_id = s.id AND po.outcome_type = 'PLACEMENT' AND po.is_verified = TRUE
        GROUP BY p.id, p.name, p.abbreviation, p.degree_level;
        """
    
    def _get_placement_summary_sql(self):
        """
        SQL for batch-wise placement summary.
        
        Returns:
            str: CREATE MATERIALIZED VIEW SQL
        """
        return """
        CREATE MATERIALIZED VIEW analytics_placement_summary AS
        SELECT 
            s.joining_year as batch_year,
            p.id as program_id,
            p.name as program_name,
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END) as placed_students,
            COUNT(DISTINCT CASE WHEN s.entry_type = 'REGULAR' THEN s.id END) as regular_admitted,
            COUNT(DISTINCT CASE WHEN s.entry_type = 'LATERAL' THEN s.id END) as lateral_admitted,
            COUNT(DISTINCT CASE WHEN s.graduation_status = 'ONTIME_NO_BACKLOG' THEN s.id END) as graduated_no_backlog,
            COUNT(DISTINCT CASE WHEN s.graduation_status = 'ONTIME_WITH_BACKLOG' THEN s.id END) as graduated_with_backlog,
            CASE 
                WHEN COUNT(DISTINCT s.id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END)::FLOAT / COUNT(DISTINCT s.id)::FLOAT * 100)
                ELSE 0
            END as placement_rate,
            AVG(CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as avg_salary,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as median_salary
        FROM students_studentprofile s
        LEFT JOIN core_program p ON s.program_id = p.id
        LEFT JOIN analytics_placementoffer po ON po.student_id = s.id AND po.outcome_type = 'PLACEMENT' AND po.is_verified = TRUE
        GROUP BY s.joining_year, p.id, p.name;
        """
    
    def _get_nirf_metrics_sql(self):
        """
        SQL for NIRF-specific metrics.
        
        Returns:
            str: CREATE MATERIALIZED VIEW SQL
        """
        return """
        CREATE MATERIALIZED VIEW analytics_nirf_metrics AS
        SELECT 
            s.joining_year as batch_year,
            p.id as program_id,
            p.name as program_name,
            p.degree_level,
            COUNT(DISTINCT s.id) as total_eligible,
            COUNT(DISTINCT CASE WHEN s.is_placed THEN s.id END) as placed_count,
            COUNT(DISTINCT CASE WHEN po.outcome_type = 'HIGHER_STUDIES' THEN s.id END) as higher_studies_count,
            COUNT(DISTINCT CASE WHEN s.is_placed OR po.outcome_type = 'HIGHER_STUDIES' THEN s.id END) as total_outcomes,
            CASE 
                WHEN COUNT(DISTINCT s.id) > 0 
                THEN (COUNT(DISTINCT CASE WHEN s.is_placed OR po.outcome_type = 'HIGHER_STUDIES' THEN s.id END)::FLOAT / COUNT(DISTINCT s.id)::FLOAT * 100)
                ELSE 0
            END as gph_percentage,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN s.is_placed AND po.total_ctc IS NOT NULL THEN po.total_ctc END) as median_salary,
            COUNT(DISTINCT CASE WHEN s.gender = 'Male' AND s.is_placed THEN s.id END) as male_placed,
            COUNT(DISTINCT CASE WHEN s.gender = 'Female' AND s.is_placed THEN s.id END) as female_placed,
            COUNT(DISTINCT CASE WHEN s.social_category IN ('SC', 'ST', 'OBC', 'EWS') AND s.is_placed THEN s.id END) as reserved_category_placed
        FROM students_studentprofile s
        LEFT JOIN core_program p ON s.program_id = p.id
        LEFT JOIN analytics_placementoffer po ON po.student_id = s.id AND po.is_verified = TRUE
        GROUP BY s.joining_year, p.id, p.name, p.degree_level;
        """
    
    def get_view_data(self, view_name, filters=None):
        """
        Query data from a materialized view.
        
        Args:
            view_name: Name of the view
            filters: Optional dict of filters (e.g., {'batch_year': 2020})
            
        Returns:
            list: Query results
        """
        query = f"SELECT * FROM {view_name}"
        
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(f"{key} = {value}")
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
        
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

