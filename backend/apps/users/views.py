"""
API Views for the Users App.

This module contains the view logic for all user-related actions, 
including user registration, login (token generation), logout, and profile management.

Architectural Note on ViewSet Usage:
------------------------------------
These views intentionally use specific DRF generic classes (e.g., CreateAPIView, APIView) instead of inheriting from the project's `BaseViewSet`. 
This is a deliberate design choice.

The `BaseViewSet` is a powerful template for standard CRUD (Create, Read, Update, Delete) operations on a model. 
However, the views in this file handle highly specialized **actions**, not standard CRUD:
- `MyTokenObtainPairView` (Login): Validates credentials and returns tokens.
- `LogoutView`: Blacklists a token and clears cookies.
- `CurrentUserView`: Is always scoped to the currently logged-in user, not a generic object retrieved by an ID.

Using more specific base classes for these actions makes the code cleaner,
more explicit, and easier to understand than trying to force these specialized workflows into a generic CRUD ViewSet.
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

# Get the active User model from the project's settings.
User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """
    An endpoint for the Placement Team to register new users.
    
    This view is protected and only accessible by authenticated users with a role that is part of the placement team (e.g., 'Placement Head').
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    # Apply permission classes: user must be logged in AND be on the placement team.
    permission_classes = [permissions.IsAuthenticated, IsPlacementTeam]

    def create(self, request, *args, **kwargs):
        """
        Overrides the default create method to ensure the response is wrapped in our project's standardized `CreatedResponse` format.
        """
        serializer = self.get_serializer(data=request.data)
        # `raise_exception=True` will automatically trigger our custom exception handler for any validation errors.
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Use the UserSerializer to format the output, ensuring sensitive data like the password is not included in the response.
        output_serializer = UserSerializer(user)
        
        return CreatedResponse(data=output_serializer.data, message="User registered successfully.")


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Handles user login. Inherits from Simple JWT's view but customizes the response to set secure, 
    HTTP-only cookies instead of returning tokens in the JSON body.
    """
    def post(self, request, *args, **kwargs):
        # Call the parent class's method first to get the token pair.
        response = super().post(request, *args, **kwargs)

        # If the login was successful (HTTP 200), set the cookies.
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            # The 'secure' flag should be True in production (HTTPS) but False
            # for local development (HTTP) to allow cookies to be set.
            is_secure = not settings.DEBUG

            # Set the access token in a secure, HTTP-only cookie.
            # `httponly=True` is the key security feature; it prevents JavaScript
            # from accessing the cookie, mitigating XSS attacks.
            response.set_cookie('access_token', access_token, httponly=True, secure=is_secure, samesite='Lax')
            
            # Set the refresh token in a separate, secure cookie.
            response.set_cookie('refresh_token', refresh_token, httponly=True, secure=is_secure, samesite='Lax')
            
            # This is the key change: we wrap the final response in our standard format
            # and remove the tokens from the body.
            success_response = SuccessResponse(message="Login successful.")
            response.data = success_response.data
            
        return response


class LogoutView(APIView):
    """
    Handles user logout by blacklisting the refresh token and deleting cookies.
    This is a protected endpoint that requires a user to be authenticated.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Blacklists the refresh token and instructs the browser to clear cookies.
        """
        try:
            # Get the refresh token from the incoming request's cookies.
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                # Use the RefreshToken object to add the token to the blacklist.
                token = RefreshToken(refresh_token)
                token.blacklist()

            # Prepare a response using our standardized NoContentResponse.
            # HTTP 204/205 tells the client the action was successful but there's no content to return.
            response = NoContentResponse()
            
            # Instruct the browser to delete the authentication cookies.
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            
            return response
            
        except Exception:
            # If any error occurs (e.g., token is invalid), we re-raise it.
            # Our global custom exception handler will catch it and return a
            # standardized 500 or 400 error response.
            raise


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    A protected endpoint for a logged-in user to GET or PATCH their own details.
    This view is always scoped to the currently authenticated user.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Overrides the default `get_object` method to always return the currently authenticated user (`request.user`).
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
        This handles both PUT and PATCH requests.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Profile updated successfully.")