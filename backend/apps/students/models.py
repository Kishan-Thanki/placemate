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
    
    # NBA Compliance Fields
    ENTRY_TYPE_CHOICES = [
        ('REGULAR', 'Regular Entry'),
        ('LATERAL', 'Lateral Entry'),
        ('TRANSFER', 'Transfer'),
    ]
    entry_type = models.CharField(
        max_length=20, 
        choices=ENTRY_TYPE_CHOICES, 
        default='REGULAR',
        help_text="Critical for NBA Success Index calculation"
    )
    backlog_ledger = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Transactional record: {semester: {subject: {fail_date, clear_date}}}"
    )
    
    # NIRF Compliance Fields
    domicile_state = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="State of domicile for NIRF diversity reporting"
    )
    SOCIAL_CATEGORY_CHOICES = [
        ('GEN', 'General'),
        ('OBC', 'Other Backward Class'),
        ('SC', 'Scheduled Caste'),
        ('ST', 'Scheduled Tribe'),
        ('EWS', 'Economically Weaker Section'),
    ]
    social_category = models.CharField(
        max_length=10, 
        choices=SOCIAL_CATEGORY_CHOICES, 
        null=True, 
        blank=True,
        help_text="Social category for NIRF diversity reporting"
    )
    
    # Graduation Status for NBA
    GRADUATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ONTIME_NO_BACKLOG', 'Graduated On Time Without Backlogs'),
        ('ONTIME_WITH_BACKLOG', 'Graduated On Time With Cleared Backlogs'),
        ('DELAYED', 'Graduated With Delay'),
        ('NOT_GRADUATED', 'Not Graduated'),
    ]
    graduation_status = models.CharField(
        max_length=30,
        choices=GRADUATION_STATUS_CHOICES,
        default='PENDING',
        help_text="NBA graduation status tracking"
    )
    
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