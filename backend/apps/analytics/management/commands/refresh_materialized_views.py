"""
Django management command to refresh materialized views.

Usage:
    python manage.py refresh_materialized_views
    python manage.py refresh_materialized_views --view analytics_department_stats
    python manage.py refresh_materialized_views --all
"""

from django.core.management.base import BaseCommand
from apps.analytics.services.materialized_view_service import MaterializedViewService


class Command(BaseCommand):
    help = 'Refresh PostgreSQL materialized views for analytics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--view',
            type=str,
            help='Refresh specific view',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Refresh all materialized views',
        )

    def handle(self, *args, **options):
        service = MaterializedViewService()
        
        view_name = options.get('view')
        refresh_all = options.get('all', False)
        
        if view_name:
            # Refresh specific view
            self.stdout.write(f'Refreshing materialized view: {view_name}...')
            success = service.refresh_view(view_name)
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully refreshed: {view_name}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Failed to refresh: {view_name}')
                )
        elif refresh_all:
            # Refresh all views
            self.stdout.write('Refreshing all materialized views...')
            results = service.refresh_all_views()
            
            for view_name, result in results.items():
                if result['status'] == 'refreshed':
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Refreshed: {view_name}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Failed: {view_name}')
                    )
        else:
            self.stdout.write(
                self.style.WARNING('Please specify --view <view_name> or --all')
            )

