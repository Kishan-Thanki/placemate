from django.db import models
from django.conf import settings

class StudentProfile(models.Model):
    GENDER_CHOICES = [('Male', 'Male'), ('Female', 'Female')]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    program = models.ForeignKey('core.Program', on_delete=models.SET_NULL, null=True)
    enrollment_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, null=True, blank=True)
    profile_picture_url = models.URLField(max_length=255, null=True, blank=True)
    
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    city = models.ForeignKey('core.City', on_delete=models.SET_NULL, null=True, blank=True)
    
    current_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    graduation_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    active_backlogs = models.IntegerField(default=0)
    tenth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    twelfth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    is_placed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"