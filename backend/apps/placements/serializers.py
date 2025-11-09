from django.db import transaction
from rest_framework import serializers
from apps.core.serializers import ProgramSerializer
from apps.companies.serializers import CompanySerializer
from .models import PlacementDrive, CompanyDrive, Job, JobProgram
from apps.core.models import Program
from apps.students.models import StudentProfile
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from .utils import send_drive_notification

class PlacementDriveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementDrive
        fields = ['id', 'title', 'start_date', 'end_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompanyDriveReadSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    placement_drive = PlacementDriveSerializer(read_only=True)
    jobs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyDrive
        fields = [
            'id', 'placement_drive', 'company', 'drive_type', 'job_mode','multiple_allowed',
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

    job_pdf = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = Job
        fields = [
            'id','company_drive',
            'title', 'description_ug', 'description_pg', 'job_pdf', 'job_desc',
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

        company_drive = job.company_drive
        program_ids = set()
        drive_jobs = company_drive.jobs.all()
        job_titles = []
        for job in drive_jobs:
            job_programs = job.eligible_programs.values_list('id', flat=True)
            program_ids.update(job_programs)
            job_titles.append(job.title)

        send_drive_notification(company_drive.company.name, company_drive.application_deadline, program_ids, job_titles)
        return job
        

class CompanyDriveJobSerializer(serializers.ModelSerializer):
    eligible_programs = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=[]
    )
    
    job_pdf = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Job
        fields = [
            'id','title', 'description_ug', 'description_pg', 'job_pdf','job_desc',
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
    jobs = CompanyDriveJobSerializer(many=True, required=True)
    
    class Meta:
        model = CompanyDrive
        fields = [
            'id', 'placement_drive', 'company', 'drive_type', 'job_mode', 'multiple_allowed',
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
        
        program_ids = set()
        for job_data in jobs_data: 
            eligible_programs = job_data.pop('eligible_programs', [])
            job = Job.objects.create(company_drive=company_drive, **job_data)

            program_ids.update(eligible_programs)
            
            for program_id in eligible_programs:
                JobProgram.objects.create(job=job, program_id=program_id)

        job_title_list = [job_data['title'] for job_data in jobs_data]
        send_drive_notification(company_drive.company.name, company_drive.application_deadline, program_ids, job_title_list)

        return company_drive

class JobReadSerializer(serializers.ModelSerializer):
    eligible_programs = ProgramSerializer(many=True, read_only=True)
    company_name = serializers.CharField(read_only=True)
    drive_title = serializers.CharField(read_only=True)
    job_pdf = serializers.FileField(read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'company_drive', 'title', 'description_ug', 'description_pg', 'job_pdf','job_desc',
            'min_ug_cgpa', 'min_pg_cgpa', 'min_tenth_percentage', 'min_twelfth_percentage',
            'max_active_backlogs', 'ug_package_min', 'ug_package_max', 'pg_package_min',
            'pg_package_max', 'ug_stipend', 'pg_stipend', 'eligible_programs',
            'company_name', 'drive_title', 'posted_at', 'updated_at'
        ]