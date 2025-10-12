"""
Core Views for the Placemate Project.

This module contains reusable, project-wide view components, including a BaseViewSet that standardizes API responses for all CRUD operations.
A set of `ReadOnlyModelViewSet` classes for providing public, filterable lookup data (e.g., countries, states, programs) to the frontend.
"""
from rest_framework import viewsets
from rest_framework.views import APIView
from .pagination import StandardPagination
from .models import Country, State, City, Degree, Program
from .response import (
    SuccessResponse, CreatedResponse, NoContentResponse,
    NotFoundResponse, ValidationErrorResponse, ErrorResponse
)
from .serializers import (
    CountrySerializer, StateSerializer, CitySerializer, 
    DegreeSerializer, ProgramSerializer,
)

class BaseViewSet(viewsets.ModelViewSet):
    """
    A custom base ViewSet that overrides default DRF actions to return standardized, 
    consistent API responses for all endpoints.

    By inheriting from this class, 
    other ViewSets automatically gain a consistent response structure for all CRUD (Create, Retrieve, Update, Delete) actions without needing to rewrite the logic.
    """
    # Use the custom pagination class to ensure paginated lists
    # match our standard response format.
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    
    def list(self, request, *args, **kwargs):
        """
        Handles GET requests for a list of objects.

        Overrides the default `list` action to wrap the response in a standardized format, including handling pagination.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            # If the response is paginated, our custom paginator class will format it correctly.
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            # For non-paginated lists, wrap in a standard SuccessResponse.
            serializer = self.get_serializer(queryset, many=True)
            return SuccessResponse(data=serializer.data, message="Data retrieved successfully")
            
        except Exception as e:
            # Fallback for any unexpected errors during list retrieval.
            return ErrorResponse(message=str(e))
    
    def retrieve(self, request, *args, **kwargs):
        """
        Handles GET requests for a single object by its ID/PK.

        Overrides the default `retrieve` action to return a standard
        SuccessResponse or a NotFoundResponse if the object doesn't exist.
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return SuccessResponse(data=serializer.data, message="Resource retrieved successfully")
        except Exception:
            return NotFoundResponse()
    
    def create(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new object.

        Overrides the default `create` action to return a standard
        CreatedResponse (201) on success or a ValidationErrorResponse on failure.
        """
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return ValidationErrorResponse(errors=serializer.errors)
        
        self.perform_create(serializer)
        return CreatedResponse(data=serializer.data)
    
    def update(self, request, *args, **kwargs):
        """
        Handles PATCH requests to update an object.

        This method is called for PATCH requests.
        """
        # The get_object() method will raise an Http404 if the object is not found,
        # which our global exception handler will catch and format.
        instance = self.get_object()

        # We set partial=True because only PATCH requests are allowed.
        serializer = self.get_serializer(instance, data=request.data, partial=True)

        # `raise_exception=True` automatically triggers our global exception
        # handler on any validation errors, returning a standardized response.
        serializer.is_valid(raise_exception=True)

        self.perform_update(serializer)
        return SuccessResponse(data=serializer.data, message="Resource updated successfully.")
    
    def destroy(self, request, *args, **kwargs):
        """
        Handles DELETE requests to remove an object.

        Overrides the default `destroy` action to return a standard
        NoContentResponse (204) for successful deletions.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return NoContentResponse()
    
class LookupAPI(APIView):
    """
    Unified lookup API for all frontend dropdown data.
    Simple, clean, single endpoint for all lookup needs.
    
    Usage:
    - Get all countries: /core/lookup/?type=countries
    - Get all states: /core/lookup/?type=states
    - Get states by country: /core/lookup/?type=states&parent_id=1
    - Get all cities: /core/lookup/?type=cities  
    - Get cities by state: /core/lookup/?type=cities&parent_id=1
    - Get all degrees: /core/lookup/?type=degrees
    - Get all programs: /core/lookup/?type=programs
    - Get programs by degree: /core/lookup/?type=programs&parent_id=1
    """
    
    def get(self, request):
        lookup_type = request.GET.get('type')
        parent_id = request.GET.get('parent_id')
        
        try:
            if lookup_type == 'countries':
                data = Country.objects.all().order_by('name')
                serializer = CountrySerializer(data, many=True)
                return SuccessResponse(
                    data=serializer.data, 
                    message="Countries retrieved successfully"
                )
            
            elif lookup_type == 'states':
                queryset = State.objects.all().order_by('name')
                if parent_id:
                    queryset = queryset.filter(country_id=parent_id)
                    message = f"States for country {parent_id} retrieved successfully"
                else:
                    message = "All states retrieved successfully"
                
                serializer = StateSerializer(queryset, many=True)
                return SuccessResponse(data=serializer.data, message=message)
            
            elif lookup_type == 'cities':
                queryset = City.objects.all().order_by('name')
                if parent_id:
                    queryset = queryset.filter(state_id=parent_id)
                    message = f"Cities for state {parent_id} retrieved successfully"
                else:
                    message = "All cities retrieved successfully"
                
                serializer = CitySerializer(queryset, many=True)
                return SuccessResponse(data=serializer.data, message=message)
            
            elif lookup_type == 'degrees':
                data = Degree.objects.all().order_by('name')
                serializer = DegreeSerializer(data, many=True)
                return SuccessResponse(
                    data=serializer.data, 
                    message="Degrees retrieved successfully"
                )
            
            elif lookup_type == 'programs':
                queryset = Program.objects.filter(is_active=True).order_by('name')
                if parent_id:
                    queryset = queryset.filter(degree_id=parent_id)
                    message = f"Programs for degree {parent_id} retrieved successfully"
                else:
                    message = "All programs retrieved successfully"
                
                serializer = ProgramSerializer(queryset, many=True)
                return SuccessResponse(data=serializer.data, message=message)
            
            else:
                return ErrorResponse(
                    message="Invalid type parameter. Valid types: countries, states, cities, degrees, programs"
                )
                
        except Exception as e:
            return ErrorResponse(message=str(e))
        
from django.http import JsonResponse
from django.middleware.csrf import get_token

def get_csrf_token(request):
    """Get CSRF token for frontend"""
    return JsonResponse({'csrfToken': get_token(request)})

def check_auth_status(request):
    """Check if user is authenticated"""
    return JsonResponse({
        'authenticated': request.user.is_authenticated,
        'user': str(request.user) if request.user.is_authenticated else None
    })