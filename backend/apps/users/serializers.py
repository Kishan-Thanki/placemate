"""
Serializers for the User and Authentication System.

This module contains the serializers that handle the conversion of the User,
Role, and Permission models into JSON format for the API, and vice-versa.
It also includes validation logic for user registration and updates.
"""
from .models import Role
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

# Get the active User model from the project's settings.
User = get_user_model()

class PermissionSerializer(serializers.ModelSerializer):
    """
    A simple serializer for Django's built-in Permission model.
    
    Used to display permission details when nested within the RoleSerializer.
    """
    class Meta:
        model = Permission
        # We only expose the 'codename' (e.g., 'add_job') and its human-readable 'name'.
        fields = ['codename', 'name']

class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for the custom Role model.
    
    Includes a nested representation of all permissions assigned to the role.
    """
    # Nest the PermissionSerializer to show all permissions for a role.
    # `many=True` indicates it's a list of permissions.
    # `read_only=True` means this field will be displayed but cannot be set directly.
    permissions = PermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for handling new user registration.
    
    Includes password confirmation and checks for duplicate email/phone numbers.
    """
    # A write-only field for password confirmation. 
    # It will be used for validation but will not be saved in the database or shown in API responses.
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'middle_name', 'last_name', 'password', 'password2')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        """
        Custom validation to check for password match and uniqueness of email/phone.
        """
        # Check that the two password fields match.
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Proactively check if the email is already in use.
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
            
        # Proactively check if the phone number is already in use.
        if User.objects.filter(phone_number=attrs['phone_number']).exists():
            raise serializers.ValidationError({"phone_number": "A user with this phone number already exists."})
            
        return attrs

    def create(self, validated_data):
        """
        Creates and returns a new User instance, given the validated data.
        """
        # Remove the confirmation password from the data before creating the user.
        validated_data.pop('password2')
        
        # Use the custom `create_user` method from our manager, which handles password hashing correctly.
        user = User.objects.create_user(**validated_data)
        
        return user

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing and updating User model instances.
    
    Designed for endpoints like a "current user" profile view. 
    It makes sensitive fields read-only to prevent users from modifying them.
    """
    # Nests the RoleSerializer to show the user's assigned roles.
    roles = RoleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'first_name', 'middle_name', 
            'last_name', 'secondary_email', 'alternate_phone', 'is_active',
            'created_at', 'updated_at', 'roles'
        ]
        # This is a critical security feature. 
        # It prevents a user from changing their own email, phone number, roles, or active status via this serializer.
        read_only_fields = ['id', 'email', 'phone_number', 'roles', 'created_at', 'updated_at', 'is_active']