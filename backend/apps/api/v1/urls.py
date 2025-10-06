from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import MyTokenObtainPairView, LogoutView

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    path('users/', include('apps.users.urls')),
    path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]