"""
Root URL Configuration for the Placemate Project.

This is the main URL dispatcher for the entire application. 
Its primary role is to act as the main entry point for all incoming web traffic and delegate requests
to the appropriate application-level URL configurations.

It defines the paths for:
- The Django Admin interface.
- The versioned application API (under /api/v1/).
- System health checks.
- API documentation.
"""
from drf_yasg import openapi
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from apps.core.views import HealthCheckView

# --- API Documentation Setup (drf-yasg) ---
# This configures the metadata for the auto-generated API documentation.
# It defines the title, version, and other information that will be displayed on the Swagger and ReDoc UI pages.
schema_view = get_schema_view(
   openapi.Info(
      title="Placemate API",
      default_version='v1',
      description="API documentation for the Placemate application.",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)


# The main list of URL patterns for the project.
urlpatterns = [
    # 1. Django Admin Interface
    # The standard path to the built-in Django administration site.
    path('admin/', admin.site.urls),

    # 2. Versioned Application API
    # This is the single, versioned entry point for the entire application API.
    # All application-specific endpoints (for users, jobs, etc.) are included from the central API router file located at `apps.api.v1.urls`.
    path('api/v1/', include('apps.api.v1.urls')),

    # 3. Health Check Endpoint
    # Includes the URLs from the `django-health-check` library. 
    # This creates the `/health/` endpoint that monitoring services (like Render) can use to verify that the application is running and healthy.
    path('health', include('health_check.urls')),   
    path('health/', include('health_check.urls')),  

    # 4. API Documentation Endpoints
    # These paths serve the auto-generated API documentation in two different user-friendly formats.
    path('docs/api/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]