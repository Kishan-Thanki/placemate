from django.db import models

class PlacementDrive(models.Model):
    title = models.CharField(max_length=255)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class CompanyDrive(models.Model):
    DRIVE_TYPES = [('FullTime', 'FullTime'), ('Internship', 'Internship'), ('Contract', 'Contract')]
    JOB_MODES = [('Onsite', 'Onsite'), ('Remote', 'Remote'), ('Hybrid', 'Hybrid')]
    STATUS_CHOICES = [('Open', 'Open'), ('Closed', 'Closed')]
    
    drive = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name="company_drives")
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name="placement_drives")
    drive_type = models.CharField(max_length=20, choices=DRIVE_TYPES)
    job_mode = models.CharField(max_length=20, choices=JOB_MODES)
    application_deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Open')
    rounds = models.JSONField(null=True, blank=True)
    locations = models.JSONField(null=True, blank=True)
    
    class Meta:
        unique_together = ('drive', 'company')
        
    def __str__(self):
        return f"{self.company.name} - {self.drive.title}"