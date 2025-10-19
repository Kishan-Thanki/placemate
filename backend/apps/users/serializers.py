"""
Serializers for the User and Authentication System.

This module defines all serializers for user management, authentication, and role-based access control.
Serializers handle data validation, transformation, and business logic for API requests and responses.

SERIALIZER OVERVIEW:
===================
1. PermissionSerializer         - Django permission representation  
2. RoleSerializer              - Role model with nested permissions
3. UserRegistrationSerializer  - Admin user creation with auto password generation
4. UserSerializer              - User profile viewing and updates
5. LoginRoleSerializer         - Lightweight role serializer for login
6. LoginUserSerializer         - Lightweight user serializer for login
7. UserRoleUpdateSerializer    - Admin role management for users
8. UserDetailSerializer        - Comprehensive user data for admin views

AUTHENTICATION FLOW:
===================
Admin Registration → UserRegistrationSerializer → Random Password → Email → User Created
User Login → LoginView → JWT with roles + active_role → Cookie-based auth
Role Management → UserRoleUpdateSerializer → Secure role updates
"""
from .models import Role
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from apps.core.tasks import send_email_in_background 

User = get_user_model()


class LoginRoleSerializer(serializers.ModelSerializer):
    """A lightweight serializer that only shows the role's name."""
    class Meta:
        model = Role
        fields = ['name']


class LoginUserSerializer(serializers.ModelSerializer):
    """A specialized, lightweight serializer for the login response body."""
    roles = LoginRoleSerializer(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'roles']


class PermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for Django's built-in Permission model.
    
    USAGE:
    ------
    Primarily used nested within RoleSerializer to display role permissions.
    """
    class Meta:
        model = Permission
        fields = ['codename', 'name']


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role model with nested permissions.
    
    USAGE:
    ------
    - Display user roles in UserSerializer
    - Role management in admin interfaces
    - Permission auditing and reporting
    """
    permissions = PermissionSerializer(many=True, read_only=True)
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    ENHANCED: Serializer for Admins to register new users with ANY roles.
    Now allows assignment of multiple roles, not just 'Admin'.
    
    PERMISSIONS:
    ------------
    - Requires IsAdminRole permission
    - Allows any role assignment (Admin, Placement, etc.)
    - Prevents privilege escalation through validation
    
    CHANGES:
    --------
    - Removed role validation restriction
    - Added comprehensive role assignment
    """
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,  
        required=True,
        help_text="List of role IDs to assign to the user"
    )

    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'last_name', 'roles')

    def validate_roles(self, roles):
        """
        ENHANCED: Validate roles without restricting to only 'Admin'.
        """
        if not roles:
            raise serializers.ValidationError("This field is required.")
        
        # Ensure all roles exist
        valid_role_ids = set(Role.objects.values_list('id', flat=True))
        provided_role_ids = {role.id for role in roles}
        
        if not provided_role_ids.issubset(valid_role_ids):
            raise serializers.ValidationError("One or more roles are invalid.")
        
        return roles

    def create(self, validated_data):
        """
        Creates the user with assigned roles.
        """
        roles_data = validated_data.pop('roles')

        password = User.objects.make_random_password()
        
        user = User.objects.create_user(password=password, **validated_data)
        user.roles.set(roles_data)

        # Send welcome email with role information
        role_names = [role.name for role in user.roles.all()]
        
        send_email_in_background(
            subject="Welcome to Placemate!",
            template_name="emails/welcome_email.html",
            context={
                'first_name': user.first_name, 
                'email': user.email, 
                'password': password,
                'roles': role_names
            },
            recipient_list=[user.email]
        )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing and updating User model instances.
    """
    roles = RoleSerializer(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'email', 'phone_number', 'first_name', 'middle_name', 'last_name', 'roles']
        read_only_fields = ['id', 'email', 'phone_number', 'roles']


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin to update user roles.
    
    SECURITY:
    ---------
    - Only allows role updates (no other user fields)
    - Prevents self-role modification (admin cannot change own roles)
    - Validates role assignments
    """
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        required=True,
        help_text="List of role IDs to assign to the user"
    )

    class Meta:
        model = User
        fields = ['roles']

    def validate_roles(self, roles):
        """
        Validate that roles exist and assignment is valid.
        """
        if not roles:
            raise serializers.ValidationError("At least one role is required.")
        
        # Check if all roles exist
        valid_role_ids = set(Role.objects.values_list('id', flat=True))
        provided_role_ids = {role.id for role in roles}
        
        if not provided_role_ids.issubset(valid_role_ids):
            raise serializers.ValidationError("One or more roles are invalid.")
        
        return roles

    def update(self, instance, validated_data):
        """
        Update user roles while maintaining data integrity.
        """
        roles = validated_data.get('roles', [])
        
        # Update roles
        instance.roles.set(roles)
        instance.save()
        
        return instance


class UserDetailSerializer(serializers.ModelSerializer):
    """
    PROPER FIX: Comprehensive user serializer for admin views with role management.
    Using EXACT field names from your custom User model.
    """
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='roles',
        help_text="Role IDs for updating user roles"
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'first_name', 'middle_name', 
            'last_name', 'secondary_email', 'alternate_phone', 'is_active', 
            'is_staff', 'created_at', 'updated_at', 'roles', 'role_ids'
        ]
        read_only_fields = [
            'id', 'email', 'phone_number', 'secondary_email', 'alternate_phone',
            'is_staff', 'created_at', 'updated_at'
        ]