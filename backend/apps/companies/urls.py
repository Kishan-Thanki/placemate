from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet

router = DefaultRouter()
router.register(r'', CompanyViewSet, basename='company')  # base URL will be /companies/

urlpatterns = [
    path('', include(router.urls)),
]
