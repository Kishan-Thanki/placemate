"""
URL Configuration for Analytics App
"""

from django.urls import path
from apps.analytics.views.dashboard_views import (
    TPODashboardView,
    StudentDashboardView,
    AdminDashboardView,
)
from apps.analytics.views.report_views import (
    NBASARReportView,
    NAACReportView,
    NAACBulkProofDownloadView,
    PlacementBookView,
)

app_name = 'analytics'

urlpatterns = [
    # Dashboard Endpoints
    path('tpo/dashboard/', TPODashboardView.as_view(), name='tpo_dashboard'),
    path('student/dashboard/', StudentDashboardView.as_view(), name='student_dashboard'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    
    # Report Export Endpoints
    path('reports/nba/sar/', NBASARReportView.as_view(), name='nba_sar_report'),
    path('reports/naac/metric-5-2-1/', NAACReportView.as_view(), name='naac_metric_5_2_1'),
    path('reports/naac/bulk-proofs/', NAACBulkProofDownloadView.as_view(), name='naac_bulk_proofs'),
    path('reports/placement-book/', PlacementBookView.as_view(), name='placement_book'),
]

