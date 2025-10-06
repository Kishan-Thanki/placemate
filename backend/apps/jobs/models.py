from django.db import models
from cloudinary.models import CloudinaryField

class Job(models.Model):
    drive = models.ForeignKey('placements.CompanyDrive', on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=255)
    description_ug = models.TextField(null=True, blank=True)
    description_pg = models.TextField(null=True, blank=True)
    job_pdf = CloudinaryField('raw', folder='job_descriptions', resource_type='raw', blank=True, null=True)
    
    min_ug_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    min_pg_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    min_tenth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    min_twelfth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_active_backlogs = models.IntegerField(null=True, blank=True)
    
    ug_package_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ug_package_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pg_package_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pg_package_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    ug_stipend = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pg_stipend = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    eligible_programs = models.ManyToManyField('core.Program', through='JobProgram', blank=True)
    
    posted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class JobProgram(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    program = models.ForeignKey('core.Program', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('job', 'program')