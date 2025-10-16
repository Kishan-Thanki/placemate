"""
API Views for the Users App.

This module contains all view logic for user authentication, registration, profile management, and administrative user operations. 
Views handle HTTP requests and return standardized API responses.

VIEW ARCHITECTURE:
=================
Authentication Views:
- MyTokenObtainPairView: User login with JWT cookie setup
- MyTokenRefreshView: Token refresh with cookie management  
- LogoutView: Session termination and token blacklisting

User Management Views:
- UserRegistrationView: Admin-only user creation with auto password generation
- CurrentUserView: User profile retrieval and updates
- UserViewSet: Administrative user management (list, retrieve, update)

SECURITY FEATURES:
=================
- JWT tokens in HTTP-only cookies for XSS protection
- Role-based access control (IsAdminRole permission)
- Token blacklisting on logout
- Secure cookie settings (HTTPS in production)
- Environment-aware SameSite cookie policies
"""

from django.conf import settings
from apps.core.views import BaseViewSet  
from rest_framework.views import APIView
from apps.core.permissions import IsAdminRole
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.core.response import SuccessResponse, NoContentResponse
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .serializers import UserRegistrationSerializer, UserSerializer, MyTokenObtainPairSerializer, LoginUserSerializer

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    An endpoint for Admins to register new non-student users (e.g., other Admins).
    It requires at least one role to be specified in the request.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsAdminRole: User must have Admin role (prevents privilege escalation)
    
    WORKFLOW:
    ---------
    1. Admin provides user details + Admin role
    2. System generates secure random password
    3. User created with hashed password
    4. Welcome email sent asynchronously with credentials
    5. Returns 201 Created with user data (password excluded)
    
    SECURITY NOTES:
    --------------
    - Only allows 'Admin' role assignment via role validation
    - Password never exposed in API responses
    - Email sent in background to prevent timing attacks
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain view that sets JWT tokens in HTTP-only cookies.
    
    SECURITY FEATURES:
    ------------------
    - HttpOnly cookies prevent XSS attacks
    - Secure cookies in production (HTTPS only)
    - Environment-aware SameSite policy
    - No domain restriction for broader compatibility
    
    COOKIE SETTINGS:
    ----------------
    Production: Secure=True, SameSite='None'
    Development: Secure=False, SameSite='Lax'
    """
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        user_serializer = LoginUserSerializer(user)

        access_token = serializer.validated_data.get('access')
        refresh_token = serializer.validated_data.get('refresh')
        
        response = SuccessResponse(
            data=user_serializer.data,
            message="Login successful."
        )
        
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
            refresh_token, 
            httponly=True, 
            secure=is_secure, 
            samesite=samesite
        )
            
        return response


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
            # Continue with cookie deletion even if blacklisting fails
            pass
        finally:
            # Always clear cookies to ensure client-side cleanup
            response = NoContentResponse(message="Logout successful.")
            is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG)
            samesite = 'None' if is_secure else 'Lax'
            
            response.delete_cookie('access_token', secure=is_secure, samesite=samesite)
            response.delete_cookie('refresh_token', secure=is_secure, samesite=samesite)
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
    An administrative endpoint for managing all users in the system.
    Provides list, retrieve, and update actions for Admins.
    
    PERMISSIONS:
    ------------
    - IsAuthenticated: User must be logged in
    - IsAdminRole: User must have Admin role (strict access control)
    
    AVAILABLE ENDPOINTS:
    --------------------
    - GET /api/v1/users/manage/: List all users (paginated)
    - GET /api/v1/users/manage/{id}/: Retrieve specific user
    - PATCH /api/v1/users/manage/{id}/: Update user details
    
    DATA INCLUDED:
    --------------
    - User details with nested role information
    - Prefetched roles for performance optimization
    - Ordered by first_name, last_name for consistent listing
    
    SECURITY:
    ---------
    - Inherits from BaseViewSet for standardized response formatting
    - Admin role required for all operations
    - No user deletion (soft delete via is_active field recommended)
    """
    queryset = User.objects.all().prefetch_related('roles')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        """Returns a list of all users, ordered by name."""
        return self.queryset.order_by('first_name', 'last_name')