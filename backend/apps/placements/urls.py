from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlacementDriveViewSet, CompanyDriveViewSet, JobViewSet

router = DefaultRouter()
router.register(r'placement-drives', PlacementDriveViewSet, basename='placement-drive')
router.register(r'company-drives', CompanyDriveViewSet, basename='company-drive')
router.register(r'jobs', JobViewSet, basename='job')

urlpatterns = [
    path('', include(router.urls)),
]