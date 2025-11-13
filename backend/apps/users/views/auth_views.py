"""
Authentication views (login, logout, token management).
"""
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from apps.core.cookies import get_cookie_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from ..serializers import LoginUserSerializer, LoginRoleSerializer, SelectRoleSerializer
from apps.core.response import SuccessResponse, NoContentResponse, ValidationErrorResponse, ForbiddenResponse

User = get_user_model()

class LoginView(APIView):
    """Authenticate users and issue JWT tokens."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginUserSerializer

    def post(self, request):
        print("🔄 Login request received from:", request.META.get('HTTP_ORIGIN'))
        print("📱 User Agent:", request.META.get('HTTP_USER_AGENT'))
        print("🍪 Cookies received:", request.COOKIES)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        
        user_with_roles = User.objects.prefetch_related('roles').get(pk=user.pk)
        user_roles = [role.name for role in user_with_roles.roles.all()]

        if not user_roles:
            return ForbiddenResponse(message="No roles assigned")

        if len(user_roles) == 1:
            return self._generate_login_response(user_with_roles, user_roles[0])

        return SuccessResponse(
            data={
                "user_id": user_with_roles.id,
                "email": user_with_roles.email,
                "first_name": user_with_roles.first_name,
                "available_roles": user_roles,
                "requires_role_selection": True,
            },
            message="Select role to continue"
        )

    def _generate_login_response(self, user, active_role):
        """Generate JWT + secure cookie login response."""
        role_names = [role.name for role in user.roles.all()]
        
        refresh = RefreshToken.for_user(user)
        refresh["first_name"] = user.first_name
        refresh["roles"] = role_names
        refresh["active_role"] = active_role

        response = SuccessResponse(
            data={
                "user": LoginRoleSerializer(user.roles.all(), many=True).data,
                "active_role": active_role,
                "available_roles": role_names,
            },
            message="Login successful",
        )

        self._set_secure_cookies(response, refresh)
        return response

    @staticmethod
    def _set_secure_cookies(response, refresh):
        """Set secure JWT cookies using centralized settings."""
        cookie_settings = get_cookie_settings()
        
        response.set_cookie(
            "access_token",
            str(refresh.access_token),
            max_age=15 * 60,
            **cookie_settings
        )
        response.set_cookie(
            "refresh_token", 
            str(refresh),
            max_age=24 * 60 * 60,
            **cookie_settings
        )


class LoginRoleView(APIView):
    """Handle role selection for users with multiple roles."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = SelectRoleSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        chosen_role = serializer.validated_data["role"]

        user_with_roles = User.objects.prefetch_related('roles').get(pk=user.pk)
        return LoginView()._generate_login_response(user_with_roles, chosen_role)


class MyTokenRefreshView(APIView):
    """Refresh JWT tokens using cookies."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return ValidationErrorResponse(
                "No refresh token found", 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            new_refresh = refresh
            new_access = new_refresh.access_token
            
            if hasattr(refresh, 'first_name'):
                new_access['first_name'] = refresh['first_name']
                new_refresh['first_name'] = refresh['first_name']
            if hasattr(refresh, 'roles'):
                new_access['roles'] = refresh['roles']
                new_refresh['roles'] = refresh['roles']
            if hasattr(refresh, 'active_role'):
                new_access['active_role'] = refresh['active_role']
                new_refresh['active_role'] = refresh['active_role']

            response = SuccessResponse(message="Token refreshed")
            cookie_settings = get_cookie_settings()
            
            response.set_cookie(
                "access_token",
                str(new_access),
                max_age=15 * 60,
                **cookie_settings
            )
            response.set_cookie(
                "refresh_token",
                str(new_refresh),
                max_age=24 * 60 * 60,
                **cookie_settings
            )
            return response
            
        except TokenError:
            return ValidationErrorResponse(
                "Invalid or expired refresh token", 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception:
            return ValidationErrorResponse(
                "Token refresh failed", 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """Logout and blacklist refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, Exception):
                pass

        response = NoContentResponse(message="Logged out")
        
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        
        return response