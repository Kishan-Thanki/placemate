"""
Serializers for Analytics Dashboard Data

Provides standardized serialization for dashboard responses.
"""

from rest_framework import serializers
from apps.students.models import StudentProfile
from apps.placements.models import CompanyDrive, Job
from apps.applications.models import CompanyDriveApplication
from apps.analytics.models.compliance_models import PlacementOffer, DocumentVerification


class DashboardResponseSerializer(serializers.Serializer):
    """Base serializer for dashboard responses"""
    last_updated = serializers.DateTimeField()


class TPODashboardOperationalSerializer(DashboardResponseSerializer):
    """Serializer for TPO operational dashboard"""
    today_interviews = serializers.IntegerField()
    pending_applications = serializers.IntegerField()
    upcoming_deadlines = serializers.IntegerField()
    active_drives = serializers.IntegerField()
    red_flags = serializers.ListField()
    recent_notifications = serializers.ListField()
    drive_pipeline = serializers.DictField()


class TPODashboardStrategicSerializer(DashboardResponseSerializer):
    """Serializer for TPO strategic dashboard"""
    season_placement_rate = serializers.FloatField()
    average_salary = serializers.FloatField()
    company_conversion_rate = serializers.FloatField()
    department_performance = serializers.ListField()
    completion_rate = serializers.FloatField()
    yoy_comparison = serializers.DictField()
    nba_compliance_status = serializers.DictField()
    nirf_metrics = serializers.DictField()


class StudentDashboardSerializer(DashboardResponseSerializer):
    """Serializer for student dashboard"""
    application_status = serializers.DictField()
    upcoming_tasks = serializers.ListField()
    profile_completeness = serializers.DictField()
    eligibility_meter = serializers.DictField()
    application_rail = serializers.ListField()


class AdminDashboardSerializer(DashboardResponseSerializer):
    """Serializer for admin/accreditation dashboard"""
    institutional_performance = serializers.DictField()
    program_analytics = serializers.DictField()
    recruiter_insights = serializers.DictField()
    nba_compliance = serializers.DictField()
    naac_compliance = serializers.DictField()
    nirf_metrics = serializers.DictField()


class RedFlagSerializer(serializers.Serializer):
    """Serializer for red flag alerts"""
    type = serializers.CharField()
    message = serializers.CharField()
    priority = serializers.CharField()
    action_url = serializers.URLField(required=False)


class ApplicationStatusRailSerializer(serializers.Serializer):
    """Serializer for application status rail"""
    application_id = serializers.IntegerField()
    company_name = serializers.CharField()
    drive_title = serializers.CharField()
    status = serializers.CharField()
    current_stage = serializers.CharField()
    stages = serializers.ListField()
    current_stage_index = serializers.IntegerField()
    applied_at = serializers.DateTimeField()

