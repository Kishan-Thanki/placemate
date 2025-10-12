"""
Core Views for the Placemate Project.

This module contains reusable, project-wide view components, including a BaseViewSet that standardizes API responses for all CRUD operations.
A set of `ReadOnlyModelViewSet` classes for providing public, filterable lookup data (e.g., countries, states, programs) to the frontend.
"""
from rest_framework.views import APIView
from .pagination import StandardPagination
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from .models import Country, State, City, Degree, Program
from .response import (
    SuccessResponse, CreatedResponse, NoContentResponse,
    NotFoundResponse, ValidationErrorResponse, ErrorResponse
)
from .serializers import (
    CountrySerializer, StateSerializer, CitySerializer, 
    DegreeSerializer, ProgramSerializer,
    LightStateSerializer, LightCitySerializer, LightProgramSerializer, LightDegreeSerializer
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
    
# Dropdown ViewSets (No Pagination)
class DropdownViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Base ViewSet for dropdown endpoints - no pagination
    """
    pagination_class = None
    
    def list(self, request, *args, **kwargs):
        """
        Override list to return all data without pagination
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="Data retrieved successfully")

class CountryDropdownViewSet(DropdownViewSet):
    queryset = Country.objects.all().order_by('name')
    serializer_class = CountrySerializer

class StateDropdownViewSet(DropdownViewSet):
    queryset = State.objects.all().order_by('name')
    serializer_class = LightStateSerializer
    
    def list(self, request, *args, **kwargs):
        country_id = request.GET.get('country_id')
        if country_id:
            queryset = self.queryset.filter(country_id=country_id)
        else:
            queryset = self.queryset
            
        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="States retrieved successfully")

class CityDropdownViewSet(DropdownViewSet):
    queryset = City.objects.all().order_by('name')
    serializer_class = LightCitySerializer
    
    def list(self, request, *args, **kwargs):
        state_id = request.GET.get('state_id')
        if state_id:
            queryset = self.queryset.filter(state_id=state_id)
        else:
            queryset = self.queryset
            
        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="Cities retrieved successfully")

class DegreeDropdownViewSet(DropdownViewSet):
    queryset = Degree.objects.all().order_by('name')
    serializer_class = LightDegreeSerializer

class ProgramDropdownViewSet(DropdownViewSet):
    queryset = Program.objects.filter(is_active=True).order_by('name')
    serializer_class = LightProgramSerializer
    
    def list(self, request, *args, **kwargs):
        degree_id = request.GET.get('degree_id')
        if degree_id:
            queryset = self.queryset.filter(degree_id=degree_id)
        else:
            queryset = self.queryset
            
        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, message="Programs retrieved successfully")

# Regular CRUD ViewSets (With Pagination)
class CountryViewSet(BaseViewSet):
    queryset = Country.objects.all().order_by('name')
    serializer_class = CountrySerializer

class StateViewSet(BaseViewSet):
    queryset = State.objects.all().order_by('name')
    serializer_class = StateSerializer
    
    @action(detail=False, methods=['get'])
    def by_country(self, request):
        """
        Get states by country ID - NO PAGINATION for dropdowns
        """
        country_id = request.GET.get('country_id')
        if not country_id:
            return ErrorResponse(message="country_id parameter is required")
        
        states = State.objects.filter(country_id=country_id).order_by('name')
        serializer = LightStateSerializer(states, many=True)
        return SuccessResponse(data=serializer.data, message="States retrieved successfully")

class CityViewSet(BaseViewSet):
    queryset = City.objects.all().order_by('name')
    serializer_class = CitySerializer
    
    @action(detail=False, methods=['get'])
    def by_state(self, request):
        """
        Get cities by state ID - NO PAGINATION for dropdowns
        """
        state_id = request.GET.get('state_id')
        if not state_id:
            return ErrorResponse(message="state_id parameter is required")
        
        cities = City.objects.filter(state_id=state_id).order_by('name')
        serializer = LightCitySerializer(cities, many=True)
        return SuccessResponse(data=serializer.data, message="Cities retrieved successfully")

class DegreeViewSet(BaseViewSet):
    queryset = Degree.objects.all().order_by('name')
    serializer_class = DegreeSerializer
    
    @action(detail=False, methods=['get'])
    def all_light(self, request):
        """
        Get all degrees with lightweight serializer - NO PAGINATION
        """
        degrees = Degree.objects.all().order_by('name')
        serializer = LightDegreeSerializer(degrees, many=True)
        return SuccessResponse(data=serializer.data, message="Degrees retrieved successfully")

class ProgramViewSet(BaseViewSet):
    queryset = Program.objects.filter(is_active=True).order_by('name')
    serializer_class = ProgramSerializer
    
    @action(detail=False, methods=['get'])
    def by_degree(self, request):
        """
        Get programs by degree ID - NO PAGINATION for dropdowns
        """
        degree_id = request.GET.get('degree_id')
        if not degree_id:
            return ErrorResponse(message="degree_id parameter is required")
        
        programs = Program.objects.filter(degree_id=degree_id, is_active=True).order_by('name')
        serializer = LightProgramSerializer(programs, many=True)
        return SuccessResponse(data=serializer.data, message="Programs retrieved successfully")

# Combined API View for all cascading dropdown data
class CascadingDropdownsAPI(APIView):
    """
    Combined API for all cascading dropdown data - NO PAGINATION
    Usage: /core/cascading-data/?type=countries
           /core/cascading-data/?type=states&country_id=1
           /core/cascading-data/?type=cities&state_id=1
           /core/cascading-data/?type=degrees
           /core/cascading-data/?type=programs&degree_id=1
    """
    
    def get(self, request):
        data_type = request.GET.get('type')
        
        if data_type == 'countries':
            countries = Country.objects.all().order_by('name')
            serializer = CountrySerializer(countries, many=True)
            return SuccessResponse(data=serializer.data, message="Countries retrieved successfully")
        
        elif data_type == 'states':
            country_id = request.GET.get('country_id')
            if not country_id:
                return ErrorResponse(message="country_id is required for states")
            states = State.objects.filter(country_id=country_id).order_by('name')
            serializer = LightStateSerializer(states, many=True)
            return SuccessResponse(data=serializer.data, message="States retrieved successfully")
        
        elif data_type == 'cities':
            state_id = request.GET.get('state_id')
            if not state_id:
                return ErrorResponse(message="state_id is required for cities")
            cities = City.objects.filter(state_id=state_id).order_by('name')
            serializer = LightCitySerializer(cities, many=True)
            return SuccessResponse(data=serializer.data, message="Cities retrieved successfully")
        
        elif data_type == 'degrees':
            degrees = Degree.objects.all().order_by('name')
            serializer = LightDegreeSerializer(degrees, many=True)
            return SuccessResponse(data=serializer.data, message="Degrees retrieved successfully")
        
        elif data_type == 'programs':
            degree_id = request.GET.get('degree_id')
            if not degree_id:
                return ErrorResponse(message="degree_id is required for programs")
            programs = Program.objects.filter(degree_id=degree_id, is_active=True).order_by('name')
            serializer = LightProgramSerializer(programs, many=True)
            return SuccessResponse(data=serializer.data, message="Programs retrieved successfully")
        
        else:
            return ErrorResponse(message="Invalid type parameter. Valid types: countries, states, cities, degrees, programs")