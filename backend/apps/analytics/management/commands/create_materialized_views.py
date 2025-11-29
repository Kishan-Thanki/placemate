"""
Django management command to create materialized views.

Usage:
    python manage.py create_materialized_views
    python manage.py create_materialized_views --view analytics_department_stats
"""

from django.core.management.base import BaseCommand
from apps.analytics.services.materialized_view_service import MaterializedViewService


class Command(BaseCommand):
    help = 'Create PostgreSQL materialized views for analytics performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--view',
            type=str,
            help='Create specific view (optional, creates all if not specified)',
        )

    def handle(self, *args, **options):
        service = MaterializedViewService()
        
        view_name = options.get('view')
        
        if view_name:
            # Create specific view
            if view_name not in service.views:
                self.stdout.write(
                    self.style.ERROR(f'View "{view_name}" not found. Available views: {", ".join(service.views.keys())}')
                )
                return
            
            self.stdout.write(f'Creating materialized view: {view_name}...')
            try:
                service.create_view(view_name, service.views[view_name])
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created view: {view_name}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating view {view_name}: {str(e)}')
                )
        else:
            # Create all views
            self.stdout.write('Creating all materialized views...')
            results = service.create_all_views()
            
            for view_name, result in results.items():
                if result['status'] == 'created':
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created: {view_name}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Failed: {view_name} - {result["error"]}')
                    )

