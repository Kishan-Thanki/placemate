"""
Serializers for the User and Authentication System.

This module defines all serializers for user management, authentication, and role-based access control.
Serializers handle data validation, transformation, and business logic for API requests and responses.

ENHANCEMENTS:
=============
- Centralized sanitization using helper method `sanitize_input`
- Field-level validation for email, phone, names, and roles
- Cross-field validation for critical logic
- Input normalization (strip, lower, title case)
- Security checks for role assignments and active status

AUTHENTICATION FLOW:
====================
Admin Registration → UserRegistrationSerializer → Random Password → Email → User Created  
User Login → LoginView → JWT with roles + active_role → Cookie-based auth  
Role Management → UserRoleUpdateSerializer → Secure role updates
"""

from .models import Role
from rest_framework import serializers
from django.contrib.auth.models import Permission
from apps.core.tasks import send_email_in_background
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()


# -------------------------- #
#   Utility Helper
# -------------------------- #
def sanitize_input(value: str) -> str:
    """Trim whitespace and normalize string values."""
    if isinstance(value, str):
        return value.strip()
    return value


# -------------------------- #
#   Role & Permission Serializers
# -------------------------- #
class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Django's built-in Permission model."""
    class Meta:
        model = Permission
        fields = ['codename', 'name']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model with nested permissions."""
    name = serializers.CharField(max_length=100)
    description = serializers.CharField(allow_blank=True, required=False)

    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']

    def validate_name(self, value):
        value = sanitize_input(value)
        if not value:
            raise serializers.ValidationError("Role name cannot be blank.")
        return value.title()

    def validate_description(self, value):
        return sanitize_input(value)


class LoginRoleSerializer(serializers.ModelSerializer):
    """A lightweight serializer that only shows the role's name."""
    name = serializers.CharField(read_only=True)

    class Meta:
        model = Role
        fields = ['name']


# -------------------------- #
#   Authentication Serializers
# -------------------------- #
class LoginUserSerializer(serializers.Serializer):
    """Validates login credentials and authenticates user."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, trim_whitespace=True)

    def validate(self, attrs):
        email = sanitize_input(attrs.get('email', '')).lower()
        password = sanitize_input(attrs.get('password', ''))

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        user = authenticate(username=email, password=password)
        if not user:
            existing_user = User.objects.filter(email=email).first()
            if existing_user and not existing_user.is_active:
                raise serializers.ValidationError("Account is disabled.")
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")

        attrs['user'] = user
        return attrs


class LoginUserResponseSerializer(serializers.ModelSerializer):
    """Lightweight serializer for login response."""
    roles = LoginRoleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'roles']


class SelectRoleSerializer(serializers.Serializer):
    """Validates and sanitizes role selection for multi-role users."""
    user_id = serializers.IntegerField(required=True)
    role = serializers.CharField(required=True)

    def validate(self, attrs):
        user_id = attrs.get("user_id")
        role = sanitize_input(attrs.get("role", "")).strip().title()

        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or inactive.")

        user_roles = [r.name for r in user.roles.all()]
        if role not in user_roles:
            raise serializers.ValidationError(f"Role '{role}' not assigned to this user.")

        attrs["user"] = user
        attrs["role"] = role
        return attrs


# -------------------------- #
#   User Management Serializers
# -------------------------- #
class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Admins to register new users with assigned roles."""
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

    def validate_email(self, value):
        value = sanitize_input(value).lower()
        if not value:
            raise serializers.ValidationError("Email cannot be blank.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_phone_number(self, value):
        value = sanitize_input(value)
        if not value:
            raise serializers.ValidationError("Phone number cannot be blank.")
        if not value.isdigit() or len(value) not in (10, 11, 12):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_first_name(self, value):
        value = sanitize_input(value)
        if not value:
            raise serializers.ValidationError("First name is required.")
        return value.title()

    def validate_last_name(self, value):
        return sanitize_input(value).title()

    def validate_roles(self, roles):
        if not roles:
            raise serializers.ValidationError("At least one role is required.")
        valid_ids = set(Role.objects.values_list('id', flat=True))
        provided_ids = {role.id for role in roles}
        if not provided_ids.issubset(valid_ids):
            raise serializers.ValidationError("One or more roles are invalid.")
        return roles

    def create(self, validated_data):
        roles = validated_data.pop('roles')
        password = User.objects.make_random_password()

        user = User.objects.create_user(password=password, **validated_data)
        user.roles.set(roles)

        send_email_in_background(
            subject="Welcome to Placemate!",
            template_name="emails/welcome_email.html",
            context={
                'first_name': user.first_name,
                'email': user.email,
                'password': password,
                'roles': [role.name for role in user.roles.all()]
            },
            recipient_list=[user.email]
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for viewing and updating User model instances."""
    roles = RoleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'first_name',
            'middle_name', 'last_name', 'roles'
        ]
        read_only_fields = ['id', 'email', 'phone_number', 'roles']

    def validate_first_name(self, value):
        value = sanitize_input(value)
        if value == '':
            raise serializers.ValidationError("First name cannot be blank.")
        return value.title()

    def validate_middle_name(self, value):
        return sanitize_input(value).title()

    def validate_last_name(self, value):
        value = sanitize_input(value)
        if value == '':
            raise serializers.ValidationError("Last name cannot be blank.")
        return value.title()


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Admins to securely update user roles."""
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
        if not roles:
            raise serializers.ValidationError("At least one role is required.")
        valid_ids = set(Role.objects.values_list('id', flat=True))
        provided_ids = {role.id for role in roles}
        if not provided_ids.issubset(valid_ids):
            raise serializers.ValidationError("One or more roles are invalid.")
        return roles

    def update(self, instance, validated_data):
        roles = validated_data.get('roles', [])
        instance.roles.set(roles)
        instance.save()
        return instance


class UserDetailSerializer(serializers.ModelSerializer):
    """Comprehensive user serializer for admin views with role management."""
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
            'id', 'email', 'phone_number', 'secondary_email',
            'alternate_phone', 'is_staff', 'created_at', 'updated_at'
        ]

    def validate_first_name(self, value):
        value = sanitize_input(value)
        if value == '':
            raise serializers.ValidationError("First name cannot be blank.")
        return value.title()

    def validate_middle_name(self, value):
        return sanitize_input(value).title()

    def validate_last_name(self, value):
        value = sanitize_input(value)
        if value == '':
            raise serializers.ValidationError("Last name cannot be blank.")
        return value.title()
