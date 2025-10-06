from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.core.permissions import IsPlacementTeam 
from rest_framework import generics, permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserRegistrationSerializer, UserSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """
    Endpoint for Placement Team to register new users.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlacementTeam]


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
            
            response.data.pop('access', None)
            response.data.pop('refresh', None)
            response.data['message'] = 'Login successful'
            
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

            response = Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            
            return response
            
        except (TokenError, Exception):
            return Response({"detail": "Error during logout."}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Protected endpoint for a logged-in user to GET or PATCH their own details.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user