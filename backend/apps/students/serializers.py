"""
Serializers for the Students App.
"""
from django.db import transaction
from .models import StudentProfile
from apps.users.models import Role  
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.tasks import send_email_in_background

User = get_user_model()


class StudentRegistrationSerializer(serializers.Serializer):
    """
    Serializer for Admins to register new Student accounts with profiles.
    """
    
    # User fields
    email = serializers.EmailField(max_length=255)
    phone_number = serializers.CharField(max_length=20)
    first_name = serializers.CharField(max_length=150)
    middle_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150)
    joining_year = serializers.IntegerField(required=True)
    
    # StudentProfile fields
    enrollment_number = serializers.CharField(max_length=50)
    program = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.program.field.related_model.objects.filter(is_active=True)
    )
    
    additional_roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        required=False
    )
    
    def validate_enrollment_number(self, value):
        if StudentProfile.objects.filter(enrollment_number=value).exists():
            raise serializers.ValidationError("Enrollment number already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already exists.")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract additional roles and profile data
        additional_roles = validated_data.pop('additional_roles', [])
        profile_data = {
            'enrollment_number': validated_data.pop('enrollment_number'),
            'program': validated_data.pop('program'),
            'joining_year': validated_data.pop('joining_year'),
        }
        
        # Generate secure random password
        password = User.objects.make_random_password()
        
        # Create User account
        user = User.objects.create_user(password=password, **validated_data)
        
        # Assign 'Student' role automatically
        student_role = Role.objects.get(name='Student')
        user.roles.add(student_role)
        
        # Assign additional roles if provided
        if additional_roles:
            user.roles.add(*additional_roles)
        
        # Create StudentProfile
        profile = StudentProfile.objects.create(user=user, **profile_data)
        
        # Send welcome email
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
        """Return student data after creation."""
        from apps.users.serializers import UserSerializer
        
        program_data = None
        if instance.program:
            program_data = {
                'id': instance.program.id,
                'name': instance.program.name,
                'degree': instance.program.degree.name if instance.program.degree else None
            }
        
        return {
            'user': UserSerializer(instance.user).data,
            'enrollment_number': instance.enrollment_number,
            'program': program_data,
        }


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile model with nested user data."""
    
    user = serializers.SerializerMethodField()
    program = serializers.StringRelatedField()
    city = serializers.StringRelatedField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'user', 'enrollment_number', 'program', 'date_of_birth', 'gender',
            'profile_picture', 'address_line1', 'address_line2', 'postal_code',
            'city', 'current_cgpa', 'graduation_cgpa', 'active_backlogs',
            'tenth_percentage', 'twelfth_percentage', 'is_placed',
            'created_at', 'updated_at', 'joining_year'
        ]
        read_only_fields = [
            'user', 'enrollment_number', 'program', 'is_placed',
            'created_at', 'updated_at', 'joining_year'
        ]
    
    def get_user(self, obj):
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
    """Comprehensive serializer for admin views."""
    
    user = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    
    class Meta(StudentProfileSerializer.Meta):
        fields = StudentProfileSerializer.Meta.fields + ['program_details']
    
    def get_user(self, obj):
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj.user).data
    
    def get_program_details(self, obj):
        if obj.program:
            from apps.core.serializers import ProgramSerializer
            return ProgramSerializer(obj.program).data
        return None


class StudentPlacementSerializer(serializers.ModelSerializer):
    """Serializer for updating student placement status."""
    
    class Meta:
        model = StudentProfile
        fields = ['is_placed']
        
    def update(self, instance, validated_data):
        instance.is_placed = validated_data.get('is_placed', instance.is_placed)
        instance.save()
        return instance