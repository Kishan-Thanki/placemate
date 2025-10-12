from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('lookup/', views.LookupAPI.as_view(), name='core-lookup'),
    path('debug/csrf/', views.get_csrf_token, name='get-csrf'),
    path('debug/auth-status/', views.check_auth_status, name='auth-status'),
]