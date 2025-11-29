from django.db import models
from cloudinary.models import CloudinaryField

class CompanyDriveApplication(models.Model):
    STATUS_CHOICES = [
        ('Applied', 'Applied'),
        ('Offered', 'Offered'),
        ('Rejected', 'Rejected'),
        ('Accepted', 'Accepted'),
        ('Declined', 'Declined')
    ]
    
    company_drive = models.ForeignKey('placements.CompanyDrive', on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey('students.StudentProfile', on_delete=models.CASCADE, related_name='job_applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')
    offered_job = models.ForeignKey('placements.Job',on_delete=models.SET_NULL, null=True, blank=True, related_name='offered_applications')
    resume = models.CharField(max_length=255)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company_drive', 'student')
        ordering = ['-applied_at']
        
    def __str__(self):
        return f"Application for {self.job.title} by {self.student}"
    
    
class JobPreference(models.Model):
    drive_application = models.ForeignKey(
        'applications.CompanyDriveApplication', 
        on_delete=models.CASCADE, 
        related_name='job_preferences'
    )
    job = models.ForeignKey('placements.Job', on_delete=models.CASCADE)
    preference_order = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = [
            ('drive_application', 'job'),
            ('drive_application', 'preference_order')
        ]
        ordering = ['preference_order']
        
    def __str__(self):
        return f"{self.drive_application.student} - {self.job.title} (Pref: {self.preference_order})"