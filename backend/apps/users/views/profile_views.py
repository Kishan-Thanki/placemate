"""
User profile management views (current user operations).
"""
from django.db import transaction
from ..serializers import UserSerializer
from django.contrib.auth import get_user_model
from apps.core.response import SuccessResponse
from rest_framework import generics, permissions

User = get_user_model()

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Allow authenticated users to view/update their profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        """Get current user profile."""
        user = self.get_object()
        serializer = self.get_serializer(user)
        return SuccessResponse(data=serializer.data, message="Profile retrieved")

    def update(self, request, *args, **kwargs):
        """Update current user profile."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            serializer.save()
            
        return SuccessResponse(data=serializer.data, message="Profile updated")