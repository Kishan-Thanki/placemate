from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class Company(models.Model):
    class CompanySize(models.IntegerChoices):
        SELF = 0, 'Self'
        RANGE_1_10 = 1, '1–10 employees'
        RANGE_11_50 = 2, '11–50 employees'
        RANGE_51_500 = 3, '51–500 employees'
        ABOVE_500 = 4, '500+ employees'

    name = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=30, unique=True)
    website_url = models.URLField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    logo = CloudinaryField('image', folder='company_logos', blank=True, null=True)
    year_founded = models.IntegerField(null=True, blank=True)
    company_size = models.IntegerField(choices=CompanySize.choices, null=True, blank=True)
    headquarters_address = models.TextField(null=True, blank=True)
    headquarters_city = models.ForeignKey('core.City', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['-created_at']  