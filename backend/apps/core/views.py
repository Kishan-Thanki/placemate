"""
Core Views for the Placemate Project.

This module contains reusable, project-wide view components, 
including a BaseViewSet that standardizes API responses for all CRUD operations.
"""
from rest_framework import viewsets
from .pagination import StandardPagination
from .response import (
    SuccessResponse, CreatedResponse, NoContentResponse,
    NotFoundResponse, ValidationErrorResponse, ErrorResponse
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