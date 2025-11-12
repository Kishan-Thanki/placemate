from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from apps.applications.models import CompanyDriveApplication, JobPreference
from apps.placements.models import Job


class JobPreferenceSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_drive_type = serializers.CharField(source='job.company_drive.drive_type', read_only=True)
    job_mode = serializers.CharField(source='job.company_drive.job_mode', read_only=True)
    
    # Make preference_order optional with default
    preference_order = serializers.IntegerField(default=1, min_value=1)

    class Meta:
        model = JobPreference
        fields = [
            'id', 'job', 'job_title', 'job_drive_type', 'job_mode', 
            'preference_order'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """
        Validate job preference - requires company_drive in context
        """
        company_drive = attrs.get('company_drive')
        job = attrs.get('job')

        # Validate job belongs to the same company drive
        if company_drive and job and job.company_drive != company_drive:
            raise serializers.ValidationError({
                'job': 'Job must belong to the same company drive'
            })

        return attrs


class CompanyDriveApplicationBaseSerializer(serializers.ModelSerializer):
    """Base serializer with common fields and validations"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    company_name = serializers.CharField(source='company_drive.company.name', read_only=True)
    drive_title = serializers.CharField(source='company_drive.placement_drive.title', read_only=True)

    class Meta:
        model = CompanyDriveApplication
        fields = [
            'id', 'company_drive', 'student', 'student_name', 'company_name', 
            'drive_title', 'status', 'resume', 'offered_job', 'applied_at', 
            'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'student_name', 'company_name', 'drive_title',
            'applied_at', 'updated_at'
        ]


    def validate(self, attrs):
        """Validate student profile and duplicate applications"""
        student_profile = self.context.get('student_profile')
        
        if not student_profile:
            raise serializers.ValidationError({
                'non_field_errors': ['Student profile not found.']
            })

        # Check for duplicate application
        company_drive = attrs.get('company_drive')

        if not company_drive:
            raise serializers.ValidationError({
                'non_field_errors': ['Company drive not found.']
            })
        
        """Validate that the drive is active and accepting applications"""
        # Check drive status
        if company_drive.status != 'Open':
            raise serializers.ValidationError("This drive is no longer accepting applications")
        
        # Check application deadline
        if company_drive.application_deadline and company_drive.application_deadline < timezone.now():
            raise serializers.ValidationError("Application deadline has passed")

        if company_drive and CompanyDriveApplication.objects.filter(
            student=student_profile, 
            company_drive=company_drive
        ).exists():
            raise serializers.ValidationError({
                'company_drive': 'You have already applied to this drive'
            })

        return attrs


class CompanyDriveApplicationCreateSerializer(CompanyDriveApplicationBaseSerializer):
    """Serializer for creating applications with job preferences"""
    job_preferences = JobPreferenceSerializer(many=True, required=True, write_only=True)

    class Meta(CompanyDriveApplicationBaseSerializer.Meta):
        fields = CompanyDriveApplicationBaseSerializer.Meta.fields + ['job_preferences']

    def validate(self, attrs):
        """
        Comprehensive validation in proper order:
        1. Parent validations (drive status, duplicates)
        2. Multiple jobs allowed check
        3. Job eligibility check
        4. Job preference validation (via JobPreferenceSerializer)
        """
        # 1. Run parent validations first
        attrs = super().validate(attrs)
        
        company_drive = attrs.get('company_drive')
        student_profile = self.context.get('student_profile')
        job_preferences_data = attrs.get('job_preferences', [])

        if not getattr(student_profile, 'is_verified', False):
            raise serializers.ValidationError({
                'non_field_errors': 'Your student profile is not verified. Please complete verification before applying.'
            })
        

        # 2. Check if multiple jobs allowed
        if company_drive and not getattr(company_drive, 'multiple_allowed', False) and len(job_preferences_data) > 1:
            raise serializers.ValidationError({
                'job_preferences': 'This drive allows only one job application. Please select only one job.'
            })

        # 3. Check eligibility for each job
        eligibility_errors = self._validate_job_eligibility(student_profile, job_preferences_data)
        if eligibility_errors:
            raise serializers.ValidationError(eligibility_errors)

        return attrs

    def _validate_job_eligibility(self, student_profile, job_preferences_data):
        """Validate eligibility for all jobs - stop at first error"""
        for pref_data in job_preferences_data:
            job = pref_data.get('job')
            is_eligible, error_message = self._check_single_job_eligibility(student_profile, job)
            
            if not is_eligible:
                return {'eligibility': f'Not eligible for {job.title}: {error_message}'}
        return None

    def _check_single_job_eligibility(self, student_profile, job):
        """Check eligibility for a single job"""
        # 1. Program eligibility
        if not job.eligible_programs.filter(id=student_profile.program.id).exists():
            return False, "Your program is not eligible for this job"

        # 2. CGPA check based on program level
        if student_profile.program.degree_level == 'UG':
            if job.min_ug_cgpa and student_profile.current_cgpa < job.min_ug_cgpa:
                return False, f"UG CGPA {student_profile.current_cgpa} below required {job.min_ug_cgpa}"
        elif student_profile.program.degree_level == 'PG':
            if job.min_pg_cgpa and student_profile.current_cgpa < job.min_pg_cgpa:
                return False, f"PG CGPA {student_profile.current_cgpa} below required {job.min_pg_cgpa}"

        # 3. Academic percentages
        if job.min_tenth_percentage and student_profile.tenth_percentage < job.min_tenth_percentage:
            return False, f"10th percentage {student_profile.tenth_percentage} below required {job.min_tenth_percentage}"

        if job.min_twelfth_percentage and student_profile.twelfth_percentage < job.min_twelfth_percentage:
            return False, f"12th percentage {student_profile.twelfth_percentage} below required {job.min_twelfth_percentage}"

        # 4. Backlogs check
        if job.max_active_backlogs is not None and student_profile.active_backlogs > job.max_active_backlogs:
            return False, f"Active backlogs {student_profile.active_backlogs} exceed maximum {job.max_active_backlogs}"

        return True, "Eligible"

    @transaction.atomic
    def create(self, validated_data):
        """Create application and job preferences in single transaction"""
        job_preferences_data = validated_data.pop('job_preferences', [])
        
        # Auto-assign student and create application
        student_profile = self.context.get('student_profile')
        validated_data['student'] = student_profile
        application = super().create(validated_data)
        
        # Create job preferences (JobPreferenceSerializer validation already done)
        for pref_data in job_preferences_data:
            JobPreference.objects.create(
                drive_application=application,
                **pref_data
            )
        
        return application


class CompanyDriveApplicationDetailSerializer(CompanyDriveApplicationBaseSerializer):
    """Serializer for detailed view with job preferences"""
    job_preferences = JobPreferenceSerializer(many=True, read_only=True)

    class Meta(CompanyDriveApplicationBaseSerializer.Meta):
        fields = CompanyDriveApplicationBaseSerializer.Meta.fields + ['job_preferences']