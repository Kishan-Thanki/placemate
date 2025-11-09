from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyDriveApplicationViewSet

router = DefaultRouter()
router.register(r'', CompanyDriveApplicationViewSet, basename='applications')

urlpatterns = [
    path('', include(router.urls)),
]