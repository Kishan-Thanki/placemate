from django.db import models
from cloudinary.models import CloudinaryField

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('Applied', 'Applied'), ('Reviewed', 'Reviewed'), ('Shortlisted', 'Shortlisted'),
        ('Rejected', 'Rejected'), ('Offered', 'Offered'), ('Accepted', 'Accepted'), ('Declined', 'Declined')
    ]
    
    job = models.ForeignKey('placements.Job', on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey('students.StudentProfile', on_delete=models.CASCADE, related_name='job_applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')
    resume = CloudinaryField('raw', folder='resumes', resource_type='raw', blank=True, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'student')
        
    def __str__(self):
        return f"Application for {self.job.title} by {self.student}"