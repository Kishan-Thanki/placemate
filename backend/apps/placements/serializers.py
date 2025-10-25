"""
Serializers for the Placements App.
"""
from rest_framework import serializers
from .models import PlacementDrive, CompanyDrive
from apps.companies.serializers import CompanySerializer

class PlacementDriveSerializer(serializers.ModelSerializer):
    """
    Serializer for PlacementDrive model (Admin only).
    Simple CRUD operations for placement seasons.
    """
    
    class Meta:
        model = PlacementDrive
        fields = [
            'id', 'title', 'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompanyDriveReadSerializer(serializers.ModelSerializer):
    """
    READ serializer for CompanyDrive (Students & Placement can view).
    
    Provides rich, nested data for frontend display:
    - Company details (name, industry, etc.)
    - Drive details (title, dates, etc.)
    - All fields are read-only for data presentation
    """
    
    # Use nested serializers for rich, read-only data
    company = CompanySerializer(read_only=True)
    drive = PlacementDriveSerializer(read_only=True)
    
    class Meta:
        model = CompanyDrive
        fields = [
            'id',
            'drive',
            'company',
            'drive_type',
            'job_mode',
            'application_deadline',
            'status',
            'rounds',
            'locations',
            'created_at',
            'updated_at'
        ]


class CompanyDriveWriteSerializer(serializers.ModelSerializer):
    """
    WRITE serializer for CompanyDrive (Admin only).
    
    Simple serializer for create/update operations:
    - Accepts FK IDs only (no nested data)
    - No duplicate validation - relies on database unique_together
    - Clean and focused on writing data
    """
    
    class Meta:
        model = CompanyDrive
        fields = [
            'drive',
            'company',
            'drive_type',
            'job_mode',
            'application_deadline',
            'status',
            'rounds',
            'locations'
        ]