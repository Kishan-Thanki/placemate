"""
Serializers for the Students App.

This module defines all serializers for student registration, profile management,
and administrative student operations.

SERIALIZER OVERVIEW:
===================
1. StudentRegistrationSerializer - Admin student creation with auto profile
2. StudentProfileSerializer     - Student profile viewing and updates  
3. StudentDetailSerializer      - Comprehensive student data for admin views
4. StudentPlacementSerializer   - Specialized serializer for placement status

BUSINESS LOGIC:
==============
Student Registration → Creates User + StudentProfile in atomic transaction
                      → Assigns 'Student' role automatically
                      → Generates secure random password
                      → Sends welcome email via background task
"""

from django.db import transaction
from .models import StudentProfile
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.tasks import send_email_in_background

User = get_user_model()


class StudentRegistrationSerializer(serializers.Serializer):
    """
    ENHANCED: Serializer for Admins to register new Student accounts with profiles.
    Now allows assignment of additional roles during registration.
    
    PERMISSIONS:
    ------------
    - Requires IsAdminRole permission
    - Automatically assigns 'Student' role
    - Allows additional role assignments
    - Prevents role privilege escalation
    
    NEW FEATURE:
    ------------
    - Optional 'additional_roles' field for assigning extra roles
    """
    
    # User fields (from base User model)
    email = serializers.EmailField(
        max_length=255,
        help_text="Student's institutional email address"
    )
    phone_number = serializers.CharField(
        max_length=20,
        help_text="Student's primary contact number"
    )
    first_name = serializers.CharField(
        max_length=150,
        help_text="Student's first name"
    )
    middle_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        help_text="Student's middle name (optional)"
    )
    last_name = serializers.CharField(
        max_length=150,
        help_text="Student's last name"
    )
    
    # StudentProfile fields
    enrollment_number = serializers.CharField(
        max_length=50,
        help_text="Unique enrollment identifier from institution"
    )
    program = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.program.field.related_model.objects.filter(is_active=True),
        help_text="Academic program ID the student is enrolled in"
    )
    
    # NEW: Additional roles field
    additional_roles = serializers.PrimaryKeyRelatedField(
        queryset=User._meta.get_field('roles').related_model.objects.all(),
        many=True,
        required=False,
        help_text="Additional role IDs to assign to the student (optional)"
    )
    
    def validate_enrollment_number(self, value):
        """Ensure enrollment number is unique."""
        if StudentProfile.objects.filter(enrollment_number=value).exists():
            raise serializers.ValidationError(
                "A student with this enrollment number already exists."
            )
        return value
    
    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value
    
    def validate_phone_number(self, value):
        """Ensure phone number is unique."""
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """
        ENHANCED: Creates User and StudentProfile with optional additional roles.
        """
        # Extract additional roles and profile data
        additional_roles = validated_data.pop('additional_roles', [])
        profile_data = {
            'enrollment_number': validated_data.pop('enrollment_number'),
            'program': validated_data.pop('program'),
        }
        
        # Generate secure random password
        password = User.objects.make_random_password()
        
        # Create User account
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Assign 'Student' role automatically
        from apps.users.models import Role
        student_role = Role.objects.get(name='Student')
        user.roles.add(student_role)
        
        # Assign additional roles if provided
        if additional_roles:
            user.roles.add(*additional_roles)
        
        # Create StudentProfile linked to the user
        profile = StudentProfile.objects.create(
            user=user,
            **profile_data
        )
        
        # Send welcome email with role information
        role_names = [role.name for role in user.roles.all()]
        
        send_email_in_background(
            subject="Welcome to Placemate - Your Student Account is Ready!",
            template_name="emails/welcome_email.html",
            context={
                'first_name': user.first_name,
                'email': user.email,
                'password': password,
                'enrollment_number': profile.enrollment_number,
                'program': profile.program.name if profile.program else 'Not specified',
                'roles': role_names
            },
            recipient_list=[user.email]
        )
        
        return profile
    
    def to_representation(self, instance):
        """
        Return student data after creation (includes role information).
        """
        from apps.users.serializers import UserSerializer
        
        return {
            'user': UserSerializer(instance.user).data,
            'enrollment_number': instance.enrollment_number,
            'program': {
                'id': instance.program.id,
                'name': instance.program.name,
                'degree': instance.program.degree.name
            } if instance.program else None,
        }


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for StudentProfile model with nested user data.
    
    USAGE:
    ------
    - Student viewing their own profile
    - Placement team viewing student details
    - Admin student management
    
    SECURITY:
    ---------
    - Read-only for students (via permissions)
    - Limited field updates based on user role
    """
    
    # Nested user data
    user = serializers.SerializerMethodField()
    program = serializers.StringRelatedField()
    city = serializers.StringRelatedField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'user',
            'enrollment_number',
            'program',
            'date_of_birth',
            'gender',
            'profile_picture',
            'address_line1',
            'address_line2', 
            'postal_code',
            'city',
            'current_cgpa',
            'graduation_cgpa',
            'active_backlogs',
            'tenth_percentage',
            'twelfth_percentage',
            'is_placed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'user', 'enrollment_number', 'program', 'is_placed',
            'created_at', 'updated_at'
        ]
    
    def get_user(self, obj):
        """Return basic user information."""
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'phone_number': obj.user.phone_number,
            'first_name': obj.user.first_name,
            'middle_name': obj.user.middle_name,
            'last_name': obj.user.last_name,
            'full_name': obj.user.get_full_name(),
        }


class StudentDetailSerializer(StudentProfileSerializer):
    """
    Comprehensive serializer for admin views with additional student data.
    
    USAGE:
    ------
    - Administrative student management
    - Placement team detailed views
    - Reporting and analytics
    
    INCLUDES:
    --------
    - Complete user information with roles
    - Academic performance metrics
    - Placement status and eligibility
    """
    
    user = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    
    class Meta(StudentProfileSerializer.Meta):
        fields = StudentProfileSerializer.Meta.fields + [
            'program_details',
        ]
    
    def get_user(self, obj):
        """Return comprehensive user information including roles."""
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj.user).data
    
    def get_program_details(self, obj):
        """Return detailed program information."""
        if obj.program:
            from apps.core.serializers import ProgramSerializer
            return ProgramSerializer(obj.program).data
        return None


class StudentPlacementSerializer(serializers.ModelSerializer):
    """
    Specialized serializer for updating student placement status.
    
    USAGE:
    ------
    - Admin marking students as placed
    - Placement status management
    
    SECURITY:
    ---------
    - Only is_placed field can be updated
    - Requires IsAdminRole permission
    """
    
    class Meta:
        model = StudentProfile
        fields = ['is_placed']
        
    def update(self, instance, validated_data):
        """Update only the placement status."""
        instance.is_placed = validated_data.get('is_placed', instance.is_placed)
        instance.save()
        return instance