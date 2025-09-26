from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name

class State(models.Model):
    name = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.name}, {self.country.name}"

class City(models.Model):
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.CASCADE)
    def __str__(self):
        return self.name

class Degree(models.Model):
    name = models.CharField(max_length=255, unique=True)
    def __str__(self):
        return self.name

class Program(models.Model):
    name = models.CharField(max_length=255, unique=True)
    abbreviation = models.CharField(max_length=20, unique=True)
    degree_level = models.CharField(max_length=50)
    duration_years = models.IntegerField(default=2)
    is_active = models.BooleanField(default=True)
    degree = models.ForeignKey(Degree, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name