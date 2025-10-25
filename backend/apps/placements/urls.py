from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlacementDriveViewSet, CompanyDriveViewSet

router = DefaultRouter()
router.register(r'placement-drives', PlacementDriveViewSet, basename='placement-drive')
router.register(r'company-drives', CompanyDriveViewSet, basename='company-drive')

urlpatterns = [
    path('', include(router.urls)),
]