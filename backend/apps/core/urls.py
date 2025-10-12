from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# Regular CRUD endpoints (with pagination)
router.register(r'countries', views.CountryViewSet, basename='country')
router.register(r'states', views.StateViewSet, basename='state')
router.register(r'cities', views.CityViewSet, basename='city')
router.register(r'degrees', views.DegreeViewSet, basename='degree')
router.register(r'programs', views.ProgramViewSet, basename='program')

# Dropdown endpoints (no pagination)
router.register(r'dropdown/countries', views.CountryDropdownViewSet, basename='dropdown-country')
router.register(r'dropdown/states', views.StateDropdownViewSet, basename='dropdown-state')
router.register(r'dropdown/cities', views.CityDropdownViewSet, basename='dropdown-city')
router.register(r'dropdown/degrees', views.DegreeDropdownViewSet, basename='dropdown-degree')
router.register(r'dropdown/programs', views.ProgramDropdownViewSet, basename='dropdown-program')

urlpatterns = [
    path('', include(router.urls)),
    
    # Combined cascading API endpoint
    path('cascading-data/', views.CascadingDropdownsAPI.as_view(), name='cascading-data'),
]