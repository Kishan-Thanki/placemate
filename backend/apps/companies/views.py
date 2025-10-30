from django.shortcuts import render
from .models import Company
from .serializers import CompanySerializer
from rest_framework import permissions  
from rest_framework import filters
from apps.core.permissions import IsAdminRole
from apps.core.views import BaseViewSet
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class CompanyViewSet(BaseViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    # Accept multipart form data for logo uploads
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    # Enable search functionality
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # Support searching across common fields including related city name and website
    search_fields = [
        'name',
        'email',
        'phone_number',
        'description',
        'headquarters_address',
        'website_url',
        'headquarters_city__name',
    ]
    ordering_fields = ['name', 'year_founded', 'created_at']
    ordering = ['-created_at']  # Default ordering: newest first
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsAdminRole]
        return [permission() for permission in permission_classes]