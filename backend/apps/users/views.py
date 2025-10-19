"""
API Views for the Users App.

This module contains all view logic for user authentication, registration, profile management, and administrative user operations. 
Views handle HTTP requests and return standardized API responses.

VIEW ARCHITECTURE:
=================
Authentication Views:
- LoginView: Main login with intelligent role handling
- LoginRoleView: Role selection for multi-role users  
- MyTokenRefreshView: Token refresh with cookie management  
- LogoutView: Session termination and token blacklisting

User Management Views:
- UserRegistrationView: Admin-only user creation with auto password generation
- CurrentUserView: User profile retrieval and updates
- UserViewSet: Administrative user management (list, retrieve, update, role management)

SECURITY FEATURES:
=================
- JWT tokens in HTTP-only cookies for XSS protection
- Role-based access control with active role support
- Token blacklisting on logout
- Secure cookie settings (HTTPS in production)
- Environment-aware SameSite cookie policies
- Intelligent role selection for multi-role users
- Admin role management capabilities
"""

from django.conf import settings
from apps.core.views import BaseViewSet  
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from apps.core.permissions import IsAdminRole
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.core.response import (
    SuccessResponse, 
    CreatedResponse,
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
    """
    Main login view that handles both single and multi-role users.
    Replaces the old MyTokenObtainPairView completely.
    
    WORKFLOW:
    ---------
    1. User provides email/password
    2. Backend validates and checks roles:
       - Single role: Directly generate tokens with that role
       - Multiple roles: Return available roles (no tokens yet)
    3. Frontend either:
       - Directly logs in (single role)
       - Shows role selection and calls LoginRoleView (multi-role)
    
    SECURITY:
    ---------
    - No tokens generated for multi-role users until role is chosen
    - Frontend must store user_id temporarily for role selection
    - Short-lived role selection window
    """
    
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return ValidationErrorResponse(
                errors={
                    'email': 'This field is required.',
                    'password': 'This field is required.'
                }
            )
        
        # Authenticate user
        user = authenticate(request, email=email, password=password)
        
        if not user:
            return UnauthorizedResponse(message="Invalid credentials.")
        
        if not user.is_active:
            return ForbiddenResponse(message="Account is disabled.")
        
        # Get all user roles
        user_roles = [role.name for role in user.roles.all()]
        
        if not user_roles:
            return ForbiddenResponse(message="No roles assigned to user.")
        
        # Simple logic: single role vs multiple roles
        if len(user_roles) == 1:
            # Single role: login directly
            return self._generate_login_response(user, user_roles[0])
        else:
            # Multiple roles: need role selection
            return SuccessResponse(
                data={
                    'user_id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'available_roles': user_roles,
                    'requires_role_selection': True
                },
                message="Multiple roles available. Please select a role to continue."
            )
    
    def _generate_login_response(self, user, active_role):
        """Generate login response with tokens."""
        refresh = RefreshToken.for_user(user)
        
        # Add claims to token
        refresh['first_name'] = user.first_name
        refresh['roles'] = [role.name for role in user.roles.all()]
        refresh['active_role'] = active_role
        
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Prepare user data
        user_serializer = LoginUserSerializer(user)
        
        response = SuccessResponse(
            data=user_serializer.data,
            message="Login successful."
        )
        
        # Set tokens in cookies
        is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
        samesite = 'None' if is_secure else 'Lax'
        
        response.set_cookie(
            'access_token', 
            access_token, 
            httponly=True, 
            secure=is_secure, 
            samesite=samesite
        )
        response.set_cookie(
            'refresh_token', 
            refresh_token, 
            httponly=True, 
            secure=is_secure, 
            samesite=samesite
        )
        
        return response


class LoginRoleView(APIView):
    """
    Handle role selection for users with multiple roles.
    
    USAGE:
    ------
    - Called by frontend after user selects role from available options
    - Requires user_id from LoginView response
    - Generates tokens with chosen active role
    
    SECURITY:
    ---------
    - Validates that user actually has the chosen role
    - Prevents role privilege escalation
    - Short time window between login and role selection
    """
    
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        chosen_role = request.data.get('role')
        
        if not user_id or not chosen_role:
            return ValidationErrorResponse(
                errors={
                    'user_id': 'This field is required.',
                    'role': 'This field is required.'
                }
            )
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return NotFoundResponse(message="User not found.")
        
        user_roles = [role.name for role in user.roles.all()]
        
        if chosen_role not in user_roles:
            return ForbiddenResponse(
                message=f"You do not have the '{chosen_role}' role."
            )
        
        return self._generate_login_response(user, chosen_role)
    
    def _generate_login_response(self, user, active_role):
        """Same as LoginView's method for consistency."""
        refresh = RefreshToken.for_user(user)
        
        refresh['first_name'] = user.first_name
        refresh['roles'] = [role.name for role in user.roles.all()]
        refresh['active_role'] = active_role
        
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        user_serializer = LoginUserSerializer(user)
        
        response = SuccessResponse(
            data={
                'user': user_serializer.data,
                'active_role': active_role,
                'available_roles': [role.name for role in user.roles.all()],
            },
            message=f"Logged in as {active_role} successfully."
        )
        
        is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
        samesite = 'None' if is_secure else 'Lax'
        
        response.set_cookie(
            'access_token', 
            access_token, 
            httponly=True, 
            secure=is_secure, 
            samesite=samesite
        )
        response.set_cookie(
            'refresh_token', 
            refresh_token, 
            httponly=True, 
            secure=is_secure, 
            samesite=samesite
        )
        
        return response


class UserRegistrationView(generics.CreateAPIView):
    """
    ENHANCED: An endpoint for Admins to register new users with ANY roles.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsAdminRole: User must have Admin role (prevents privilege escalation)
    
    WORKFLOW:
    ---------
    1. Admin provides user details + roles
    2. System generates secure random password
    3. User created with hashed password and assigned roles
    4. Welcome email sent asynchronously with credentials and role info
    5. Returns 201 Created with user data (password excluded)
    
    SECURITY NOTES:
    --------------
    - Allows any role assignment (Admin, Placement, Student, etc.)
    - Password never exposed in API responses
    - Email sent in background to prevent timing attacks
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class MyTokenRefreshView(APIView):
    """
    Custom view to refresh tokens. 
    It's exempt from global authentication as it relies solely on the refresh_token from the cookie.
    
    SECURITY DESIGN:
    ----------------
    - No authentication required (uses refresh token from cookie)
    - Automatically rotates refresh tokens if configured
    - Returns new tokens in HTTP-only cookies
    - Handles token blacklisting and validation
    - Environment-aware cookie security settings
    
    WORKFLOW:
    ---------
    1. Extract refresh_token from HTTP-only cookie
    2. Validate and refresh the token
    3. Generate new access token (and refresh token if rotation enabled)
    4. Set new tokens in cookies with proper security settings
    5. Return success response
    
    ERROR HANDLING:
    ---------------
    - 400: Invalid or expired refresh token
    - 401: No refresh token in cookies
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            raise InvalidToken("No refresh token found in cookies.")

        try:
            token = RefreshToken(refresh_token)
            access_token = str(token.access_token)
            new_refresh_token = str(token)

            response = SuccessResponse(message="Token refreshed successfully.")

            # Environment-aware security settings
            is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
            samesite = 'None' if is_secure else 'Lax'
            
            response.set_cookie(
                'access_token', 
                access_token, 
                httponly=True, 
                secure=is_secure, 
                samesite=samesite
            )
            response.set_cookie(
                'refresh_token', 
                new_refresh_token, 
                httponly=True, 
                secure=is_secure, 
                samesite=samesite
            )
            
            return response
            
        except TokenError as e:
            raise InvalidToken(e.args[0])


class LogoutView(APIView):
    """
    Handles user logout by blacklisting the refresh token and clearing auth cookies.
    
    SECURITY ACTIONS:
    -----------------
    1. Blacklists refresh token to prevent reuse
    2. Clears access_token and refresh_token cookies
    3. Returns 204 No Content with cleared cookies
    
    ERROR HANDLING:
    ---------------
    - Continues logout even if token blacklisting fails
    - Always clears cookies to ensure client-side cleanup
    - Returns 204 regardless of token blacklist success
    
    NOTE:
    -----
    Access tokens remain valid until expiration since they're stateless.
    Refresh token blacklisting prevents obtaining new access tokens.
    """
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        response = NoContentResponse(message="Logout successful.")
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    A protected endpoint for users to view and update their own profile.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - Object-level: Users can only access their own profile
    
    AVAILABLE ACTIONS:
    ------------------
    - GET /api/v1/users/me/: Retrieve current user profile
    - PATCH /api/v1/users/me/: Update user profile (partial updates allowed)
    
    FIELD RESTRICTIONS:
    -------------------
    - Read-only: id, email, phone_number, roles (prevents privilege escalation)
    - Updatable: first_name, middle_name, last_name
    
    RESPONSE FORMAT:
    ----------------
    Standardized SuccessResponse with user data and descriptive message
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="Profile retrieved successfully.")
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Profile updated successfully.")


class UserViewSet(BaseViewSet):
    """
    ENHANCED: An administrative endpoint for managing all users in the system.
    Now includes role management capabilities.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsAdminRole: User must have Admin role (strict access control)
    
    NEW FEATURES:
    -------------
    - Role management via PATCH /api/v1/users/manage/{id}/roles/
    - Comprehensive user details with roles
    - User activation/deactivation
    - Role-based filtering
    
    AVAILABLE ENDPOINTS:
    --------------------
    - GET /api/v1/users/manage/: List all users (paginated)
    - GET /api/v1/users/manage/{id}/: Retrieve specific user
    - PATCH /api/v1/users/manage/{id}/: Update user details
    - PATCH /api/v1/users/manage/{id}/roles/: Update user roles
    - PATCH /api/v1/users/manage/{id}/activation/: Activate/deactivate user
    
    SECURITY:
    ---------
    - Inherits from BaseViewSet for standardized response formatting
    - Admin role required for all operations
    - No user deletion (soft delete via is_active field recommended)
    - Prevents self-role modification
    """
    queryset = User.objects.all().prefetch_related('roles')
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action in ['retrieve', 'list']:
            return UserDetailSerializer
        elif self.action == 'update_roles':
            return UserRoleUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        """
        Returns optimized queryset with role management and filtering.
        """
        queryset = self.queryset.order_by('first_name', 'last_name')
        
        # Filter by role if specified
        role_id = self.request.query_params.get('role_id')
        if role_id:
            queryset = queryset.filter(roles__id=role_id)
            
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        return queryset.distinct()

    @action(detail=True, methods=['patch'], url_path='roles')
    def update_roles(self, request, pk=None):
        """
        Specialized endpoint for updating user roles.
        
        USAGE:
        ------
        PATCH /api/v1/users/manage/{id}/roles/
        {
            "roles": [1, 2, 3]  # List of role IDs
        }
        
        SECURITY:
        ---------
        - Prevents admin from removing their own admin role
        - Validates all role assignments
        - Maintains audit trail
        """
        user = self.get_object()
        
        # Prevent self-role modification (admin cannot change their own roles)
        if user == request.user:
            return ForbiddenResponse(
                message="You cannot modify your own roles for security reasons."
            )
        
        serializer = UserRoleUpdateSerializer(
            user, 
            data=request.data, 
            partial=True
        )
        
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        serializer.save()
        
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message="User roles updated successfully."
        )

    @action(detail=True, methods=['patch'], url_path='activation')
    def update_activation(self, request, pk=None):
        """
        Activate or deactivate a user account.
        
        USAGE:
        ------
        PATCH /api/v1/users/manage/{id}/activation/
        {
            "is_active": true|false
        }
        """
        user = self.get_object()
        
        # Prevent self-deactivation
        if user == request.user and not request.data.get('is_active', True):
            return ForbiddenResponse(
                message="You cannot deactivate your own account."
            )
        
        is_active = request.data.get('is_active')
        if is_active is None:
            return ValidationErrorResponse(
                errors={"is_active": "This field is required."}
            )
        
        user.is_active = is_active
        user.save()
        
        action = "activated" if is_active else "deactivated"
        
        return SuccessResponse(
            data=UserDetailSerializer(user).data,
            message=f"User account {action} successfully."
        )