from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class StudentProfile(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'), 
        ('Female', 'Female'), 
        ('Other', 'Other'), 
        ('Prefer not to say', 'Prefer not to say')
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    program = models.ForeignKey('core.Program', on_delete=models.SET_NULL, null=True)
    enrollment_number = models.CharField(max_length=50, unique=True)    
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, null=True, blank=True)
    profile_picture = CloudinaryField(
        'image',
        folder='profile_pictures',
        blank=True,
        null=True
    )
    
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    city = models.ForeignKey('core.City', on_delete=models.SET_NULL, null=True, blank=True)
    
    current_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    graduation_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    active_backlogs = models.IntegerField(default=0)
    tenth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    twelfth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    joining_year = models.IntegerField(null=False, blank=False,default=2024) 
    is_placed = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=~models.Q(is_verified=True) | 
                (
                    models.Q(tenth_percentage__isnull=False) &
                    models.Q(twelfth_percentage__isnull=False) &
                    models.Q(current_cgpa__isnull=False)
                ),
                name='verified_student_has_required_data'
            )
        ]