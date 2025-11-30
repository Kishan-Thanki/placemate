"""
Admin user management views (user CRUD, role management).
"""
from django.db import transaction
from apps.core.views import BaseViewSet
from rest_framework.decorators import action
from apps.core.permissions import IsAdminRole
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from apps.core.response import SuccessResponse, NoContentResponse, ValidationErrorResponse, ForbiddenResponse
from ..serializers import UserRegistrationSerializer, UserSerializer, UserDetailSerializer, UserRoleUpdateSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """Admin-only user registration with role assignment."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def perform_create(self, serializer):
        """Ensure atomic transaction for user creation."""
        with transaction.atomic():
            return serializer.save()


class UserViewSet(BaseViewSet):
    """Admin-level user management with role control."""
    queryset = User.objects.all().prefetch_related("roles")
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_serializer_class(self):
        if self.action in ["retrieve", "list"]:
            return UserDetailSerializer
        if self.action == "update_roles":
            return UserRoleUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        """Optimized queryset with filtering."""
        queryset = self.queryset.order_by("first_name", "last_name")

        role_id = self.request.query_params.get("role_id")
        if role_id and role_id.isdigit():
            queryset = queryset.filter(roles__id=int(role_id))

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            is_active_bool = is_active.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        """List users with optimized query."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="Users retrieved")

    def retrieve(self, request, *args, **kwargs):
        """Retrieve specific user."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="User retrieved")

    @action(detail=True, methods=["patch"], url_path="roles")
    def update_roles(self, request, pk=None):
        """Update user roles."""
        user = self.get_object()
        if user == request.user:
            return ForbiddenResponse(message="Cannot modify own roles")

        serializer = UserRoleUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            serializer.save()
            
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message="Roles updated",
        )

    @action(detail=True, methods=["patch"], url_path="activation")
    def update_activation(self, request, pk=None):
        """Activate/deactivate a user."""
        user = self.get_object()

        if user == request.user and not request.data.get("is_active", True):
            return ForbiddenResponse(message="Cannot deactivate own account")

        is_active = request.data.get("is_active")
        if is_active is None:
            return ValidationErrorResponse(errors={"is_active": "Required"})

        user.is_active = bool(is_active)
        
        with transaction.atomic():
            user.save()

        status_msg = "activated" if user.is_active else "deactivated"
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message=f"User {status_msg}",
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a user (override for custom response)."""
        user = self.get_object()
        
        if user == request.user:
            return ForbiddenResponse(message="Cannot delete own account")
            
        user.delete()
        return NoContentResponse(message="User deleted successfully")