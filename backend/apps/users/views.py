"""
User Authentication and Management API Views
"""
from django.conf import settings
from apps.core.views import BaseViewSet  
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from apps.core.permissions import IsAdminRole
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.core.response import (
    SuccessResponse, 
    NoContentResponse, 
    ValidationErrorResponse,
    UnauthorizedResponse,
    ForbiddenResponse,
    NotFoundResponse
)
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer,
    UserDetailSerializer,
    UserRoleUpdateSerializer,
    LoginUserSerializer
)

User = get_user_model()


class LoginView(APIView):
    """Handle user login with role-based authentication"""
    
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return ValidationErrorResponse(
                errors={'email': 'Required', 'password': 'Required'}
            )
        
        user = authenticate(request, email=email, password=password)
        
        if not user:
            return UnauthorizedResponse(message="Invalid credentials")
        if not user.is_active:
            return ForbiddenResponse(message="Account disabled")
        
        user_roles = [role.name for role in user.roles.all()]
        if not user_roles:
            return ForbiddenResponse(message="No roles assigned")
        
        # Single role: login directly, Multiple roles: need selection
        if len(user_roles) == 1:
            return self._generate_login_response(user, user_roles[0])
        else:
            return SuccessResponse(
                data={
                    'user_id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'available_roles': user_roles,
                    'requires_role_selection': True
                },
                message="Select role to continue"
            )
    
    def _generate_login_response(self, user, active_role):
        """Generate login response with JWT tokens"""
        refresh = RefreshToken.for_user(user)
        refresh['first_name'] = user.first_name
        refresh['roles'] = [role.name for role in user.roles.all()]
        refresh['active_role'] = active_role
        
        user_serializer = LoginUserSerializer(user)
        
        response = SuccessResponse(
            data={
                'user': user_serializer.data,
                'active_role': active_role,
                'available_roles': [role.name for role in user.roles.all()],
            },
            message="Login successful"
        )
        
        # Set secure cookies
        is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
        samesite = 'None' if is_secure else 'Lax'
        
        response.set_cookie('access_token', str(refresh.access_token), 
                          httponly=True, secure=is_secure, samesite=samesite)
        response.set_cookie('refresh_token', str(refresh), 
                          httponly=True, secure=is_secure, samesite=samesite)
        
        return response


class LoginRoleView(APIView):
    """Handle role selection for multi-role users"""
    
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        chosen_role = request.data.get('role')
        
        if not user_id or not chosen_role:
            return ValidationErrorResponse(
                errors={'user_id': 'Required', 'role': 'Required'}
            )
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return NotFoundResponse(message="User not found")
        
        user_roles = [role.name for role in user.roles.all()]
        if chosen_role not in user_roles:
            return ForbiddenResponse(message=f"Role '{chosen_role}' not assigned")
        
        return self._generate_login_response(user, chosen_role)
    
    def _generate_login_response(self, user, active_role):
        """Generate login response after role selection"""
        refresh = RefreshToken.for_user(user)
        refresh['first_name'] = user.first_name
        refresh['roles'] = [role.name for role in user.roles.all()]
        refresh['active_role'] = active_role
        
        user_serializer = LoginUserSerializer(user)
        
        response = SuccessResponse(
            data={
                'user': user_serializer.data,
                'active_role': active_role,
                'available_roles': [role.name for role in user.roles.all()],
            },
            message=f"Logged in as {active_role}"
        )
        
        is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
        samesite = 'None' if is_secure else 'Lax'
        
        response.set_cookie('access_token', str(refresh.access_token), 
                          httponly=True, secure=is_secure, samesite=samesite)
        response.set_cookie('refresh_token', str(refresh), 
                          httponly=True, secure=is_secure, samesite=samesite)
        
        return response


class UserRegistrationView(generics.CreateAPIView):
    """Admin-only user registration with role assignment"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class MyTokenRefreshView(APIView):
    """Refresh JWT tokens from cookies"""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            raise InvalidToken("No refresh token found")

        try:
            token = RefreshToken(refresh_token)
            response = SuccessResponse(message="Token refreshed")

            is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
            samesite = 'None' if is_secure else 'Lax'
            
            response.set_cookie('access_token', str(token.access_token), 
                              httponly=True, secure=is_secure, samesite=samesite)
            response.set_cookie('refresh_token', str(token), 
                              httponly=True, secure=is_secure, samesite=samesite)
            
            return response
        except TokenError as e:
            raise InvalidToken(str(e))


class LogoutView(APIView):
    """Handle user logout with token blacklisting"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        response = NoContentResponse(message="Logged out")
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="Profile retrieved")
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Profile updated")


class UserViewSet(BaseViewSet):
    """Admin user management with role control"""
    queryset = User.objects.all().prefetch_related('roles')
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'list']:
            return UserDetailSerializer
        elif self.action == 'update_roles':
            return UserRoleUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = self.queryset.order_by('first_name', 'last_name')
        
        # Filtering
        role_id = self.request.query_params.get('role_id')
        if role_id:
            queryset = queryset.filter(roles__id=role_id)
            
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        return queryset.distinct()

    @action(detail=True, methods=['patch'], url_path='roles')
    def update_roles(self, request, pk=None):
        """Update user roles"""
        user = self.get_object()
        
        if user == request.user:
            return ForbiddenResponse(message="Cannot modify own roles")
        
        serializer = UserRoleUpdateSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        serializer.save()
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message="Roles updated"
        )

    @action(detail=True, methods=['patch'], url_path='activation')
    def update_activation(self, request, pk=None):
        """Activate/deactivate user"""
        user = self.get_object()
        
        if user == request.user and not request.data.get('is_active', True):
            return ForbiddenResponse(message="Cannot deactivate own account")
        
        is_active = request.data.get('is_active')
        if is_active is None:
            return ValidationErrorResponse(errors={"is_active": "Required"})
        
        user.is_active = is_active
        user.save()
        
        action = "activated" if is_active else "deactivated"
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message=f"User {action}"
        )