from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from apps.applications.models import CompanyDriveApplication, JobPreference
from apps.placements.models import Job


class JobPreferenceSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_drive_type = serializers.CharField(source='job.company_drive.drive_type', read_only=True)
    job_mode = serializers.CharField(source='job.company_drive.job_mode', read_only=True)

    class Meta:
        model = JobPreference
        fields = [
            'id', 'job', 'job_title', 'job_drive_type', 'job_mode', 
            'preference_order'
        ]
        read_only_fields = ['id']

    def validate_preference_order(self, value):
        if value < 1:
            raise serializers.ValidationError("Preference order must be at least 1")
        return value

    def validate(self, attrs):
        drive_application = self.context.get('drive_application')
        job = attrs.get('job')
        preference_order = attrs.get('preference_order')

        if drive_application and job:
            # Check if job belongs to the same company drive
            if job.company_drive != drive_application.company_drive:
                raise serializers.ValidationError({
                    'job': 'Job must belong to the same company drive'
                })

        if drive_application and preference_order:
            # Check for duplicate preference orders
            duplicate = JobPreference.objects.filter(
                drive_application=drive_application,
                preference_order=preference_order
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if duplicate.exists():
                raise serializers.ValidationError({
                    'preference_order': f'Preference order {preference_order} already exists for this application'
                })

        return attrs
    

class CompanyDriveApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    company_name = serializers.CharField(source='company_drive.company.name', read_only=True)
    drive_title = serializers.CharField(source='company_drive.placement_drive.title', read_only=True)
    job_preferences = JobPreferenceSerializer(many=True, required=False, read_only=True)

    class Meta:
        model = CompanyDriveApplication
        fields = [
            'id', 'company_drive', 'student', 'student_name', 'company_name', 
            'drive_title', 'status', 'resume', 'offered_job', 'applied_at', 
            'updated_at', 'job_preferences'
        ]
        read_only_fields = [
            'id', 'student', 'student_name', 'company_name', 'drive_title',
            'applied_at', 'updated_at'
        ]

    def validate_company_drive(self, value):
        """Validate that the drive is active and accepting applications"""
    
        # Check if drive status is 'Open'
        if value.status != 'Open':
            raise serializers.ValidationError("This drive is no longer accepting applications")
        
        # Check if application deadline has passed
        if value.application_deadline and value.application_deadline < timezone.now():
            raise serializers.ValidationError("Application deadline has passed")
        
        return value
    
    def validate(self, attrs):
        """Validate the entire application"""
        student_profile = self.context.get('student_profile')
        
        if not student_profile:
            raise serializers.ValidationError({
                'non_field_errors': ['Student profile not found.']
            })

        # Ensure student doesn't apply twice to same drive
        company_drive = attrs.get('company_drive')
        if company_drive and CompanyDriveApplication.objects.filter(
            student=student_profile, 
            company_drive=company_drive
        ).exists():
            raise serializers.ValidationError({
                'company_drive': 'You have already applied to this drive'
            })


        return attrs
    
class CompanyDriveApplicationCreateSerializer(CompanyDriveApplicationSerializer):
    """Serializer specifically for creating applications with job preferences"""
    job_preferences = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=True, 
        allow_empty=False, 
        help_text="List of job preferences with 'job' and 'preference_order'. At least one preference is required."
    )

    class Meta(CompanyDriveApplicationSerializer.Meta):
        fields = CompanyDriveApplicationSerializer.Meta.fields + ['job_preferences']

    def validate_job_preferences(self, value):
        """Validate job preferences data structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Job preferences must be a list")
        
        # Ensure at least one preference
        if len(value) == 0:
            raise serializers.ValidationError("At least one job preference is required")
        
        # Validate each preference
        for pref in value:
            if not isinstance(pref, dict):
                raise serializers.ValidationError("Each preference must be a dictionary")
            if 'job' not in pref:
                raise serializers.ValidationError("Each preference must include 'job' field")
            if 'preference_order' in pref and pref['preference_order'] < 1:
                raise serializers.ValidationError("Preference order must be at least 1")
        
        return value


    def validate(self, attrs):
        # First, run the parent validations (duplicate check, etc.)
        attrs = super().validate(attrs)
        
        # Get student and their preferred jobs
        student_profile = self.context.get('student_profile')
        job_preferences_data = attrs.get('job_preferences', [])
        
        # Check if student is eligible for each job they applied to
        for pref_data in job_preferences_data:
            job_id = pref_data.get('job')
            
            # Get the job details
            job = Job.objects.get(id=job_id)
            
            # Check CGPA
            if student_profile.program.degree_level == 'UG':
                if job.min_ug_cgpa and student_profile.current_cgpa < job.min_ug_cgpa:
                    raise serializers.ValidationError({
                        'eligibility': f'Your CGPA {student_profile.current_cgpa} is below required {job.min_ug_cgpa} for {job.title}'
                    })
                
            if student_profile.program.degree_level == 'PG':
                if job.min_pg_cgpa and student_profile.current_cgpa < job.min_pg_cgpa:
                    raise serializers.ValidationError({
                        'eligibility': f'Your CGPA {student_profile.current_cgpa} is below required {job.min_pg_cgpa} for {job.title}'
                    })

            # Check 10th percentage
            if job.min_tenth_percentage and student_profile.tenth_percentage < job.min_tenth_percentage:
                raise serializers.ValidationError({
                    'eligibility': f'Your 10th percentage {student_profile.tenth_percentage} is below required {job.min_tenth_percentage} for {job.title}'
                })
            
            # Check 12th percentage  
            if job.min_twelfth_percentage and student_profile.twelfth_percentage < job.min_twelfth_percentage:
                raise serializers.ValidationError({
                    'eligibility': f'Your 12th percentage {student_profile.twelfth_percentage} is below required {job.min_twelfth_percentage} for {job.title}'
                })
            
            # Check backlogs
            if job.max_active_backlogs is not None and student_profile.active_backlogs > job.max_active_backlogs:
                raise serializers.ValidationError({
                    'eligibility': f'Your active backlogs {student_profile.active_backlogs} exceed maximum {job.max_active_backlogs} for {job.title}'
                })
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        job_preferences_data = validated_data.pop('job_preferences', [])
        
        # Auto-assign student from context (provided by ViewSet)
        student_profile = self.context.get('student_profile')
        
        validated_data['student'] = student_profile
        application = super().create(validated_data)
        
        # Create job preferences with validation
        for pref_data in job_preferences_data:
            try:
                JobPreference.objects.create(
                    drive_application=application,
                    job_id=pref_data.get('job'),
                    preference_order=pref_data.get('preference_order', 1)
                )
            except Exception as e:
                raise serializers.ValidationError({
                    'job_preferences': f'Error creating preference: {str(e)}'
                })
        
        return application
