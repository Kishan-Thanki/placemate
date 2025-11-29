"""
Django management command to set up analytics system.

This command:
1. Creates all materialized views
2. Creates initial placement policies
3. Sets up dashboard cache

Usage:
    python manage.py setup_analytics
"""

from django.core.management.base import BaseCommand
from apps.analytics.services.materialized_view_service import MaterializedViewService
from apps.analytics.models.compliance_models import PlacementPolicy


class Command(BaseCommand):
    help = 'Set up analytics system (create views, policies, etc.)'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Placemate Analytics System...')
        self.stdout.write('')
        
        # 1. Create materialized views
        self.stdout.write('Step 1: Creating materialized views...')
        view_service = MaterializedViewService()
        results = view_service.create_all_views()
        
        for view_name, result in results.items():
            if result['status'] == 'created':
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Created: {view_name}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed: {view_name} - {result["error"]}')
                )
        
        self.stdout.write('')
        
        # 2. Create default placement policies
        self.stdout.write('Step 2: Creating default placement policies...')
        default_policies = [
            {
                'name': 'One Dream Offer Policy',
                'description': 'Students can only have one Dream tier offer at a time',
                'conditions': {'offer_tier': 'DREAM'},
                'action': 'BLOCK',
                'priority': 10,
            },
            {
                'name': 'Standard to Dream Upgrade',
                'description': 'Allow upgrade from Standard to Dream offer',
                'conditions': {'upgrade_allowed': True},
                'action': 'ALLOW',
                'priority': 5,
            },
        ]
        
        for policy_data in default_policies:
            policy, created = PlacementPolicy.objects.get_or_create(
                name=policy_data['name'],
                defaults=policy_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Created policy: {policy.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'  - Policy already exists: {policy.name}')
                )
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS('Analytics system setup complete!')
        )
        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Refresh views periodically: python manage.py refresh_materialized_views --all')
        self.stdout.write('  2. Set up cron job for automatic refresh (optional)')

