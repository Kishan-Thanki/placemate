from . import views
from django.urls import path, include
from .views import debug_email_config  
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('lookup/', views.LookupAPI.as_view(), name='core-lookup'),
    path('debug/email-config/', debug_email_config),
]