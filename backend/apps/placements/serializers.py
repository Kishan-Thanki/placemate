from django.db import transaction
from rest_framework import serializers
from apps.core.serializers import ProgramSerializer
from apps.companies.serializers import CompanySerializer
from .models import PlacementDrive, CompanyDrive, Job, JobProgram

class PlacementDriveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementDrive
        fields = ['id', 'title', 'start_date', 'end_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompanyDriveReadSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    drive = PlacementDriveSerializer(read_only=True)
    jobs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyDrive
        fields = [
            'id', 'drive', 'company', 'drive_type', 'job_mode',
            'application_deadline', 'status', 'rounds', 'locations',
            'created_at', 'updated_at', 'jobs_count'
        ]
    
    def get_jobs_count(self, obj):
        return obj.jobs.count()


class JobWriteSerializer(serializers.ModelSerializer):
    eligible_programs = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=[]
    )
    
    class Meta:
        model = Job
        fields = [
            'drive',  
            'title', 'description_ug', 'description_pg', 'job_pdf',
            'min_ug_cgpa', 'min_pg_cgpa', 'min_tenth_percentage', 'min_twelfth_percentage',
            'max_active_backlogs', 'ug_package_min', 'ug_package_max', 'pg_package_min',
            'pg_package_max', 'ug_stipend', 'pg_stipend', 'eligible_programs'
        ]
    
    def create(self, validated_data):
        eligible_programs = validated_data.pop('eligible_programs', [])
        job = Job.objects.create(**validated_data)
        
        for program_id in eligible_programs:
            relation_exists = JobProgram.objects.filter(
                job=job, 
                program_id=program_id
            ).exists()
            
            if not relation_exists:
                JobProgram.objects.create(job=job, program_id=program_id)
            else:
                print(f"Warning: Skipped duplicate JobProgram: Job {job.id} -> Program {program_id}")
        
        return job


class CompanyDriveWriteSerializer(serializers.ModelSerializer):
    jobs = JobWriteSerializer(many=True, required=True)
    
    class Meta:
        model = CompanyDrive
        fields = [
            'drive', 'company', 'drive_type', 'job_mode',
            'application_deadline', 'status', 'rounds', 'locations', 'jobs'
        ]
    
    def validate_jobs(self, value):
        """Enforce at least one job"""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one job is required.")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        jobs_data = validated_data.pop('jobs')
        company_drive = CompanyDrive.objects.create(**validated_data)
        
        for job_data in jobs_data:
            eligible_programs = job_data.pop('eligible_programs', [])
            job = Job.objects.create(drive=company_drive, **job_data)
            
            for program_id in eligible_programs:
                JobProgram.objects.create(job=job, program_id=program_id)
        
        return company_drive


class JobReadSerializer(serializers.ModelSerializer):
    eligible_programs = ProgramSerializer(many=True, read_only=True)
    company_name = serializers.CharField(read_only=True)
    drive_title = serializers.CharField(read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'drive', 'title', 'description_ug', 'description_pg', 'job_pdf',
            'min_ug_cgpa', 'min_pg_cgpa', 'min_tenth_percentage', 'min_twelfth_percentage',
            'max_active_backlogs', 'ug_package_min', 'ug_package_max', 'pg_package_min',
            'pg_package_max', 'ug_stipend', 'pg_stipend', 'eligible_programs',
            'company_name', 'drive_title', 'posted_at', 'updated_at'
        ]