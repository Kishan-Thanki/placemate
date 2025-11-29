"""
Dashboard and Caching Models for Analytics Performance

These models support materialized views and caching for dashboard performance.
"""

from django.db import models
from django.utils import timezone


class DashboardCache(models.Model):
    """
    Caches pre-calculated dashboard metrics for performance.
    Refreshed periodically via background tasks.
    """
    cache_key = models.CharField(max_length=255, unique=True)
    cache_data = models.JSONField(default=dict)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dashboard Cache"
        verbose_name_plural = "Dashboard Caches"
        indexes = [
            models.Index(fields=['cache_key', 'expires_at']),
        ]
    
    def __str__(self):
        return f"{self.cache_key} (expires: {self.expires_at})"
    
    def is_expired(self):
        return timezone.now() > self.expires_at


class MaterializedViewConfig(models.Model):
    """
    Configuration for PostgreSQL materialized views.
    Tracks refresh schedules and last refresh times.
    """
    view_name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    sql_definition = models.TextField(help_text="SQL for creating the materialized view")
    
    REFRESH_STRATEGY_CHOICES = [
        ('MANUAL', 'Manual Refresh'),
        ('HOURLY', 'Hourly'),
        ('DAILY', 'Daily'),
        ('ON_DEMAND', 'On Demand (Triggered)'),
    ]
    refresh_strategy = models.CharField(
        max_length=20,
        choices=REFRESH_STRATEGY_CHOICES,
        default='DAILY'
    )
    
    last_refreshed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Materialized View Config"
        verbose_name_plural = "Materialized View Configs"
        ordering = ['view_name']
    
    def __str__(self):
        return f"{self.view_name} ({self.refresh_strategy})"

