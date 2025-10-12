"""
Serializers for the User and Authentication System.

This module defines all serializers for user management, authentication, and role-based access control.
Serializers handle data validation, transformation, and business logic for API requests and responses.

SERIALIZER OVERVIEW:
===================
1. MyTokenObtainPairSerializer  - JWT token customization with user claims
2. PermissionSerializer         - Django permission representation  
3. RoleSerializer              - Role model with nested permissions
4. UserRegistrationSerializer  - Admin user creation with auto password generation
5. UserSerializer              - User profile viewing and updates

AUTHENTICATION FLOW:
===================
Admin Registration → UserRegistrationSerializer → Random Password → Email → User Created
User Login → MyTokenObtainPairSerializer → JWT with roles → Cookie-based auth
"""
from .models import Role
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from apps.core.tasks import send_email_in_background 
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that enhances tokens with user-specific claims.
    
    USAGE:
    ------
    Used by MyTokenObtainPairView to generate tokens with custom payload.
    Frontend can decode tokens to display user info and control UI based on roles.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['first_name'] = user.first_name
        token['roles'] = [role.name for role in user.roles.all()]
        return token
    
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
    Serializer for Admins to register new Admin users.
    Generates a temporary password and emails it to the new user asynchronously.
    
    PERMISSIONS:
    ------------
    - Requires IsAdminRole permission
    - Only allows 'Admin' role assignment
    - Prevents privilege escalation attacks
    
    VALIDATION:
    -----------
    - Email and phone number uniqueness enforced by model
    - Roles field required and validated
    - Only 'Admin' roles allowed in registration
    """
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,  
        required=True,
        help_text="List of role IDs (only 'Admin' roles allowed)"
    )

    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'last_name', 'roles')

    def validate_roles(self, roles):
        """
        Ensure only 'Admin' role can be assigned via this endpoint.
        """
        if not roles:
            raise serializers.ValidationError("This field is required.")
        for role in roles:
            if role.name != 'Admin':
                raise serializers.ValidationError("Invalid role. Only 'Admin' can be assigned here.")
        return roles

    def create(self, validated_data):
        """
        Creates the user, generates a random password, and sends a welcome email in a background thread.
        """
        roles_data = validated_data.pop('roles')

        password = User.objects.make_random_password()
        
        user = User.objects.create_user(password=password, **validated_data)
        user.roles.set(roles_data)

        send_email_in_background(
            subject="Welcome to Placemate!",
            template_name="emails/welcome_email.html",
            context={
                'first_name': user.first_name, 
                'email': user.email, 
                'password': password
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