from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name'] 

    def __str__(self):
        return self.name

class State(models.Model):
    name = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.country.name}"

class City(models.Model):
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Degree(models.Model):
    name = models.CharField(max_length=255, unique=True)
    abbreviation = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ['name']
        
    def __str__(self):
        return self.name

class Program(models.Model):
    class DegreeLevel(models.TextChoices):
        UNDERGRADUATE = 'UG', 'Undergraduate'
        POSTGRADUATE = 'PG', 'Postgraduate'
        DOCTORATE = 'Doctorate', 'Doctorate'
        
    name = models.CharField(max_length=255, unique=True)
    abbreviation = models.CharField(max_length=50, unique=True)
    degree_level = models.CharField(max_length=20, choices=DegreeLevel.choices)
    duration_years = models.IntegerField()
    is_active = models.BooleanField(default=True)
    degree = models.ForeignKey(Degree, on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']
    
    @property
    def full_abbreviation(self):
        return f"{self.degree.abbreviation} {self.abbreviation}"

    def __str__(self):
        return self.name