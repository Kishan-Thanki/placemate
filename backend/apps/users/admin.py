"""
Django Admin Configuration for the Users App.

This file customizes the Django admin interface for User and Role models.
It removes password fields from user creation and implements auto-password generation
with email notifications, providing a consistent experience with the API.
"""

from django import forms
from .models import User, Role
from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.admin import UserAdmin
from apps.core.tasks import send_email_in_background

class CustomUserCreationForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'last_name', 'roles')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def save(self, commit=True):
        password = User.objects.make_random_password()
        
        user = User.objects.create_user(
            email=self.cleaned_data['email'],
            phone_number=self.cleaned_data['phone_number'],
            password=password,
            first_name=self.cleaned_data.get('first_name', ''),
            last_name=self.cleaned_data.get('last_name', ''),
            is_staff=True,       
            is_superuser=True,    
            is_active=True        
        )
        
        if self.cleaned_data.get('roles'):
            user.roles.set(self.cleaned_data['roles'])
        
        user._generated_password = password
        
        return user

    def save_m2m(self):
        pass

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'created_at')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'roles', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone_number', 'first_name', 'last_name', 'roles'),
        }),
    )
    
    fieldsets = (
        (None, {'fields': ('email', 'phone_number')}),
        ('Personal Info', {'fields': ('first_name', 'middle_name', 'last_name', 'secondary_email', 'alternate_phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'roles')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        defaults = {}
        if obj is None:
            defaults['form'] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)
    
    def save_model(self, request, obj, form, change):
        if not change:  
            if hasattr(obj, '_generated_password'):
                password = obj._generated_password
                delattr(obj, '_generated_password')
            else:
                password = User.objects.make_random_password()
                obj.set_password(password)
            
            if not obj.is_staff:
                obj.is_staff = True
            if not obj.is_superuser:
                obj.is_superuser = True
            
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

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    filter_horizontal = ('permissions',)
    search_fields = ('name', 'description')
    list_filter = ('permissions',)