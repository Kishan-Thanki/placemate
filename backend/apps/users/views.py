from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserRegistrationSerializer, UserSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """
    Public endpoint for new users to register.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


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

            response.set_cookie(
                'access_token', 
                access_token, 
                httponly=True, 
                secure=is_secure, 
                samesite='Lax',
                max_age=60 * 15 
            )
            response.set_cookie(
                'refresh_token', 
                refresh_token, 
                httponly=True, 
                secure=is_secure, 
                samesite='Lax',
                max_age=60 * 60 * 24 * 7 
            )
            
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

            response = Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT
            )
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            
            return response
            
        except TokenError:
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": "Error during logout."},
                status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(generics.RetrieveAPIView):
    """
    Protected endpoint for a logged-in user to get their own details.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user