"""
User Authentication and Management API Views

Refactored for:
- Full serializer-based validation and sanitization
- Cleaner, DRY views
- Consistent JWT + cookie handling
- Better separation of concerns
"""
from django.conf import settings
from apps.core.views import BaseViewSet
from rest_framework.views import APIView
from rest_framework.decorators import action
from apps.core.permissions import IsAdminRole
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.core.response import (
    SuccessResponse,
    NoContentResponse,
    ValidationErrorResponse,
    ForbiddenResponse,
    NotFoundResponse
)

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserDetailSerializer,
    UserRoleUpdateSerializer,
    LoginUserSerializer,
    LoginRoleSerializer
)

User = get_user_model()


# ----------------------------------------------------------------------
# LOGIN FLOW
# ----------------------------------------------------------------------

class LoginView(APIView):
    """Authenticate users and issue JWT tokens."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginUserSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user_roles = [role.name for role in user.roles.all()]

        if not user_roles:
            return ForbiddenResponse(message="No roles assigned")

        # Single role → direct login
        if len(user_roles) == 1:
            return self._generate_login_response(user, user_roles[0])

        # Multiple roles → role selection required
        return SuccessResponse(
            data={
                "user_id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "available_roles": user_roles,
                "requires_role_selection": True,
            },
            message="Select role to continue"
        )

    def _generate_login_response(self, user, active_role):
        """Generate JWT + secure cookie login response."""
        refresh = RefreshToken.for_user(user)
        refresh["first_name"] = user.first_name
        refresh["roles"] = [r.name for r in user.roles.all()]
        refresh["active_role"] = active_role

        response = SuccessResponse(
            data={
                "user": LoginRoleSerializer(user.roles, many=True).data,
                "active_role": active_role,
                "available_roles": [r.name for r in user.roles.all()],
            },
            message="Login successful",
        )

        self._set_secure_cookies(response, refresh)
        return response

    @staticmethod
    def _set_secure_cookies(response, refresh):
        """Set secure JWT cookies."""
        is_secure = getattr(settings, "SESSION_COOKIE_SECURE", not settings.DEBUG)
        samesite = "None" if is_secure else "Lax"

        response.set_cookie(
            "access_token",
            str(refresh.access_token),
            httponly=True,
            secure=is_secure,
            samesite=samesite,
        )
        response.set_cookie(
            "refresh_token",
            str(refresh),
            httponly=True,
            secure=is_secure,
            samesite=samesite,
        )


class LoginRoleView(APIView):
    """Handle role selection for users with multiple roles."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .serializers import SelectRoleSerializer

        serializer = SelectRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        chosen_role = serializer.validated_data["role"]

        return LoginView()._generate_login_response(user, chosen_role)


# ----------------------------------------------------------------------
# REGISTRATION & TOKEN MANAGEMENT
# ----------------------------------------------------------------------

class UserRegistrationView(generics.CreateAPIView):
    """Admin-only user registration with role assignment."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class MyTokenRefreshView(APIView):
    """Refresh JWT tokens using cookies."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            raise InvalidToken("No refresh token found")

        try:
            token = RefreshToken(refresh_token)
            response = SuccessResponse(message="Token refreshed")
            LoginView._set_secure_cookies(response, token)
            return response
        except TokenError as e:
            raise InvalidToken(str(e))


class LogoutView(APIView):
    """Logout and blacklist refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        response = NoContentResponse(message="Logged out")
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


# ----------------------------------------------------------------------
# USER MANAGEMENT & PROFILE
# ----------------------------------------------------------------------

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Allow authenticated users to view/update their profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return SuccessResponse(data=serializer.data, message="Profile retrieved")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return SuccessResponse(data=serializer.data, message="Profile updated")


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
        queryset = self.queryset.order_by("first_name", "last_name")

        role_id = self.request.query_params.get("role_id")
        if role_id:
            queryset = queryset.filter(roles__id=role_id)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.distinct()

    @action(detail=True, methods=["patch"], url_path="roles")
    def update_roles(self, request, pk=None):
        """Update user roles."""
        user = self.get_object()
        if user == request.user:
            return ForbiddenResponse(message="Cannot modify own roles")

        serializer = UserRoleUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
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

        user.is_active = is_active
        user.save()

        status_msg = "activated" if is_active else "deactivated"
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message=f"User {status_msg}",
        )
