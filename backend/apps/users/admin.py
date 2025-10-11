from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from .models import User, Role
from apps.core.tasks import send_email_in_background

class CustomUserCreationForm(UserCreationForm):
    """Custom form that removes password fields and uses auto-password generation"""
    class Meta:
        model = User
        fields = ('email', 'phone_number', 'first_name', 'last_name', 'roles')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the password fields since we auto-generate them
        if 'password1' in self.fields:
            del self.fields['password1']
        if 'password2' in self.fields:
            del self.fields['password2']
    
    def save(self, commit=True):
        if commit:
            # Use existing UserManager methods for auto-password generation
            password = User.objects.make_random_password()
            user = User.objects.create_user(
                email=self.cleaned_data['email'],
                phone_number=self.cleaned_data['phone_number'],
                password=password,
                first_name=self.cleaned_data.get('first_name', ''),
                last_name=self.cleaned_data.get('last_name', '')
            )
            
            # Add roles
            if self.cleaned_data.get('roles'):
                user.roles.set(self.cleaned_data['roles'])
            
            # Send welcome email
            try:
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
            except Exception as e:
                print(f"Email sending failed: {e}")
            
            return user
        else:
            return super().save(commit=False)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom User Admin that removes password fields and uses auto-password generation"""
    add_form = CustomUserCreationForm
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'roles')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
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
        ('Personal info', {'fields': ('first_name', 'middle_name', 'last_name', 'secondary_email', 'alternate_phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'roles')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        """Handle password generation for users created via admin change form"""
        if not change:  # Only for new users
            password = User.objects.make_random_password()
            obj.set_password(password)
            
        super().save_model(request, obj, form, change)
        
        # Send email for new users
        if not change:
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
                self.message_user(request, f"User created successfully. Password sent to {obj.email}.", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"User created but email failed: {str(e)}", messages.WARNING)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    filter_horizontal = ('permissions',)
    search_fields = ('name',)