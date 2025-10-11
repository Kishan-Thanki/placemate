import string
import secrets
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Permission

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.ManyToManyField(Permission, blank=True)

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, phone_number, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not phone_number:
            raise ValueError('The Phone Number field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, phone_number, password, **extra_fields)
    
    def make_random_password(self, length=12, include_symbols=True, exclude_similar=True):
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        symbols = "!@#$%^&*" if include_symbols else ""
        
        if exclude_similar:
            uppercase = uppercase.replace('O', '').replace('I', '')
            lowercase = lowercase.replace('l', '')
            digits = digits.replace('0', '').replace('1', '')
        
        password_parts = [
            secrets.choice(uppercase),
            secrets.choice(lowercase),
            secrets.choice(digits),
        ]
        
        if include_symbols:
            password_parts.append(secrets.choice(symbols))
            remaining_length = length - 4
        else:
            remaining_length = length - 3
        
        all_chars = uppercase + lowercase + digits + symbols
        password_parts.extend(secrets.choice(all_chars) for _ in range(remaining_length))
        
        secrets.SystemRandom().shuffle(password_parts)
        return ''.join(password_parts)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True)
    
    first_name = models.CharField(max_length=150, blank=True)
    middle_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    secondary_email = models.EmailField(unique=True, null=True, blank=True)
    alternate_phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    roles = models.ManyToManyField(Role, blank=True)
    
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone_number']

    def __str__(self):
        return self.email

    def get_full_name(self):
        full_name = f"{self.first_name} {self.middle_name} {self.last_name}"
        return " ".join(full_name.split())