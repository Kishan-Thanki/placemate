"""
API Views for the Users App.

This module contains the view logic for all user-related actions, 
including user registration, login (token generation), logout, and profile management.

Architectural Note on ViewSet Usage:
------------------------------------
These views intentionally use specific DRF generic classes instead of inheriting from the project's `BaseViewSet`. 
This is a deliberate design choice because they handle highly specialized **actions** (like login/logout) rather than
standard CRUD operations on a model.
"""
from django.conf import settings
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from apps.core.permissions import IsPlacementTeam
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserRegistrationSerializer, UserSerializer
from apps.core.response import SuccessResponse, CreatedResponse, NoContentResponse

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    An endpoint for the Placement Team to register new users.
    This view is protected and only accessible by the placement team.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlacementTeam]

    def create(self, request, *args, **kwargs):
        """
        Overrides the default create method to use our custom CreatedResponse format.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Use the UserSerializer to format the output, 
        # ensuring sensitive data like the password is not included in the response.
        output_serializer = UserSerializer(user)
        
        return CreatedResponse(data=output_serializer.data, message="User registered successfully.")


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Handles user login and sets JWTs in secure, HTTP-only cookies.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            is_secure = not settings.DEBUG

            response.set_cookie('access_token', access_token, httponly=True, secure=is_secure, samesite='Lax')
            response.set_cookie('refresh_token', refresh_token, httponly=True, secure=is_secure, samesite='Lax')
            
            # This is the key change: we wrap the final response in our standard format.
            success_response = SuccessResponse(message="Login successful.")
            response.data = success_response.data
            
        return response


class LogoutView(APIView):
    """
    Handles user logout by blacklisting the refresh token and deleting cookies.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            # Prepare a response using our standardized NoContentResponse.
            response = NoContentResponse()
            
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            
            return response
        except Exception:
            # Re-raise any error to be handled by the global exception handler.
            raise


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    A protected endpoint for a logged-in user to GET or PATCH their own details.
    This view is always scoped to the currently authenticated user.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # --- THIS IS THE KEY CHANGE TO DISABLE PUT ---
    # This view will now only accept GET (retrieve) and PATCH (partial update) requests.
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        """
        Overrides the default `get_object` to always return the current user.
        """
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        """
        Overrides the default retrieve method to use our custom SuccessResponse.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return SuccessResponse(data=serializer.data, message="Profile retrieved successfully.")

    def update(self, request, *args, **kwargs):
        """
        Overrides the default update method to use our custom SuccessResponse.
        This will now only be called for PATCH requests.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Profile updated successfully.")