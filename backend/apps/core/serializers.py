"""
Serializers for the Core App's lookup models.

This module defines a set of simple serializers that convert the core data models (like Country, State, Program) into JSON format. 
These are used to provide essential lookup data to the frontend, for example, to populate dropdown menus in forms.
"""
from rest_framework import serializers
from .models import Country, State, City, Degree, Program

class CountrySerializer(serializers.ModelSerializer):
    """Serializer for the Country model."""
    class Meta:
        model = Country
        fields = ['id', 'name']

class StateSerializer(serializers.ModelSerializer):
    """Serializer for the State model."""
    class Meta:
        model = State
        fields = ['id', 'name', 'country']

class CitySerializer(serializers.ModelSerializer):
    """Serializer for the City model."""
    class Meta:
        model = City
        fields = ['id', 'name', 'state']

class DegreeSerializer(serializers.ModelSerializer):
    """Serializer for the Degree model."""
    class Meta:
        model = Degree
        fields = ['id', 'name', 'abbreviation']

class ProgramSerializer(serializers.ModelSerializer):
    """
    Serializer for the Program model.
    Includes a nested representation of the related Degree for richer data.
    """
    
    degree = DegreeSerializer(read_only=True)
    
    class Meta:
        model = Program
        fields = ['id', 'name', 'abbreviation', 'degree', 'degree_level']