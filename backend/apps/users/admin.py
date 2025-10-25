"""
Django Admin Configuration for the Users App.

This file customizes the Django admin interface for User and Role models.
It replaces the default user creation form with a custom one that
automatically generates a secure password and sends a welcome email.
"""

from django import forms
from .models import User, Role
from django.contrib import admin
from django.contrib import messages
from apps.core.tasks import send_email_in_background
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class CustomUserCreationForm(forms.ModelForm):
    """
    A custom form for creating new users in the admin panel.
    It does not require a password.
    """
    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'last_name', 'roles', 'is_staff', 'is_superuser')

    def save(self, commit=True):
        """
        Saves the new user, generates a random password, and stores it
        temporarily on the user object to be used by the save_model hook.
        """
        user = super().save(commit=False)
        
        password = User.objects.make_random_password()
        user.set_password(password)
        
        user._generated_password = password 

        if commit:
            user.save()
            self.save_m2m()

        return user


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """
    Customizes the admin interface for the User model.
    """
    add_form = CustomUserCreationForm
    
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'get_roles')
    list_filter = ('is_staff', 'is_active', 'roles')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    readonly_fields = ('last_login', 'created_at', 'updated_at')
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone_number', 'first_name', 'last_name', 'roles', 'is_staff', 'is_superuser'),
        }),
    )
    
    fieldsets = (
        (None, {'fields': ('email', 'phone_number')}),
        ('Personal Info', {'fields': ('first_name', 'middle_name', 'last_name', 'secondary_email', 'alternate_phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'roles')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    def get_form(self, request, obj=None, **kwargs):
        """Use CustomUserCreationForm for adding users."""
        defaults = {}
        if obj is None:
            defaults['form'] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)

    def save_model(self, request, obj, form, change):
        """
        Called when saving a user.
        If it's a new user, send the welcome email.
        """
        if not change:
            if hasattr(obj, '_generated_password'):
                password = obj._generated_password
                delattr(obj, '_generated_password') 
            else:
                password = User.objects.make_random_password()
                obj.set_password(password)

            super().save_model(request, obj, form, change)
            
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
            super().save_model(request, obj, form, change)

    @admin.display(description='Roles')
    def get_roles(self, obj):
        """A helper method to display roles cleanly in the list view."""
        return ", ".join([role.name for role in obj.roles.all()])


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """
    Customizes the admin interface for the Role model.
    """
    list_display = ('name', 'description')
    search_fields = ('name',)
    filter_horizontal = ('permissions',)