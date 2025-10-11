from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import CompanyViewSet   
# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(r'', CompanyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
