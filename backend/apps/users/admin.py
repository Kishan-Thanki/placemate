"""
Django Admin Configuration for the Users App.

This file customizes the Django admin interface for User and Role models.
It removes password fields from user creation and implements auto-password generation
with email notifications, providing a consistent experience with the API.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib import messages
from .models import User, Role
from apps.core.tasks import send_email_in_background

class CustomUserCreationForm(forms.ModelForm):
    """
    Custom user creation form that removes password fields and implements
    auto-password generation with email notifications.
    
    SECURITY FEATURES:
    - Removes password1 and password2 fields from admin interface
    - Automatically generates secure random passwords
    - Sends welcome emails with temporary passwords
    - Maintains consistency with API user registration
    """
    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'last_name', 'roles')
    
    def __init__(self, *args, **kwargs):
        """
        Initialize the form without password fields.
        """
        super().__init__(*args, **kwargs)
    
    def save(self, commit=True):
        """
        Save the user with auto-generated password WITHOUT sending email.
        
        WORKFLOW:
        1. Generate secure random password
        2. Create user with generated password
        3. Assign roles if provided
        4. Return created user (email is sent in save_model)
        """
        # Generate secure random password
        password = User.objects.make_random_password()
        
        # Create user using UserManager with full admin permissions
        user = User.objects.create_user(
            email=self.cleaned_data['email'],
            phone_number=self.cleaned_data['phone_number'],
            password=password,
            first_name=self.cleaned_data.get('first_name', ''),
            last_name=self.cleaned_data.get('last_name', ''),
            is_staff=True,        # Enable admin access
            is_superuser=True,    # Give full permissions
            is_active=True        # Ensure user is active
        )
        
        # Add roles if provided
        if self.cleaned_data.get('roles'):
            user.roles.set(self.cleaned_data['roles'])
        
        # Store password for later use in save_model
        user._generated_password = password
        
        return user

    def save_m2m(self):
        """
        This method is required by Django admin to save many-to-many relationships.
        Since we're handling roles in the save() method, this can be empty.
        """
        pass

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Custom User Admin configuration that provides a password-free user creation
    experience with auto-generated passwords and email notifications.
    
    ADMIN FEATURES:
    - No password fields in user creation form
    - Auto-password generation for new users
    - Welcome email sending
    - Enhanced user listing and filtering
    - Read-only timestamps for auditing
    """
    add_form = CustomUserCreationForm
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'created_at')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'roles', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    # Fields for adding new user (NO PASSWORD FIELDS)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone_number', 'first_name', 'last_name', 'roles'),
        }),
    )
    
    # Fields for editing existing user
    fieldsets = (
        (None, {'fields': ('email', 'phone_number')}),
        ('Personal Info', {'fields': ('first_name', 'middle_name', 'last_name', 'secondary_email', 'alternate_phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'roles')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        """
        Use custom form for adding users, default form for changing.
        """
        defaults = {}
        if obj is None:
            defaults['form'] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)
    
    def save_model(self, request, obj, form, change):
        """
        Handle password generation and email sending for new users.
        
        This method coordinates with the CustomUserCreationForm to ensure
        only ONE email is sent with the correct password.
        """
        if not change:  # Only for new users
            # Check if form already generated a password
            if hasattr(obj, '_generated_password'):
                # Form already generated password, use it
                password = obj._generated_password
                # Remove the temporary attribute
                delattr(obj, '_generated_password')
            else:
                # Fallback: generate password here
                password = User.objects.make_random_password()
                obj.set_password(password)
            
            # Ensure admin users have full permissions
            if not obj.is_staff:
                obj.is_staff = True
            if not obj.is_superuser:
                obj.is_superuser = True
            
            # Save the user first
            super().save_model(request, obj, form, change)
            
            # Send welcome email
            try:
                send_email_in_background(
                    subject="Welcome to Placemate!",
                    template_name="emails/welcome_email.html", 
                    context={
                        'first_name': obj.first_name,
                        'email': obj.email,
                        'password': password
                    },
                    recipient_list=[obj.email]
                )
                self.message_user(
                    request, 
                    f"User created successfully. Password sent to {obj.email}.", 
                    messages.SUCCESS
                )
            except Exception as e:
                self.message_user(
                    request, 
                    f"User created but email failed: {str(e)}", 
                    messages.WARNING
                )
        else:
            # For existing users, just save normally
            super().save_model(request, obj, form, change)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """
    Admin configuration for Role model with enhanced permission management.
    
    FEATURES:
    - Role listing with descriptions
    - Horizontal filter for permissions
    - Search functionality
    - Clean permission management interface
    """
    list_display = ('name', 'description')
    filter_horizontal = ('permissions',)
    search_fields = ('name', 'description')
    list_filter = ('permissions',)