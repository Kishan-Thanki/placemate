from django.shortcuts import render
from .models import Company
from .serializers import CompanySerializer
from rest_framework import permissions  
from apps.core.permissions import IsAdminRole
from apps.core.views import BaseViewSet
# Create your views here.

from .models import Company
from rest_framework import permissions
from apps.core.views import BaseViewSet  
from .serializers import CompanySerializer
from apps.core.permissions import IsAdminRole

class CompanyViewSet(BaseViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsAdminRole]
        return [permission() for permission in permission_classes]