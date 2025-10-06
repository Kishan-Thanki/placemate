from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination

from apps.core.response import (
    SuccessResponse, CreatedResponse, NoContentResponse,
    NotFoundResponse, ValidationErrorResponse, ErrorResponse
)

class BaseViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with standardized responses for all endpoints
    """
    pagination_class = StandardPagination
    
    def list(self, request, *args, **kwargs):
        """Standard list response"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return SuccessResponse(data=serializer.data, message="Data retrieved successfully")
            
        except Exception as e:
            return ErrorResponse(message=str(e))
    
    def retrieve(self, request, *args, **kwargs):
        """Standard retrieve response"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return SuccessResponse(data=serializer.data, message="Resource retrieved successfully")
        except Exception as e:
            return NotFoundResponse(message=str(e))
    
    def create(self, request, *args, **kwargs):
        """Standard create response"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            
            response_serializer = self.get_serializer(instance)
            
            return CreatedResponse(
                data=response_serializer.data, 
                message=f"{self.get_resource_name()} created successfully"
            )
            
        except Exception as e:
            return ValidationErrorResponse(
                errors=serializer.errors if hasattr(serializer, 'errors') else {},
                message=str(e)
            )
    
    def update(self, request, *args, **kwargs):
        """Standard update response"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            
            response_serializer = self.get_serializer(instance)
            return SuccessResponse(
                data=response_serializer.data,
                message=f"{self.get_resource_name()} updated successfully"
            )
            
        except Exception as e:
            return ValidationErrorResponse(
                errors=serializer.errors if hasattr(serializer, 'errors') else {},
                message=str(e)
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Standard partial update response"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            
            response_serializer = self.get_serializer(instance)
            return SuccessResponse(
                data=response_serializer.data,
                message=f"{self.get_resource_name()} updated successfully"
            )
            
        except Exception as e:
            return ValidationErrorResponse(
                errors=serializer.errors if hasattr(serializer, 'errors') else {},
                message=str(e)
            )
    
    def destroy(self, request, *args, **kwargs):
        """Standard delete response"""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return NoContentResponse()
        except Exception as e:
            return ErrorResponse(message=str(e))
    
    def get_resource_name(self):
        """Get resource name for response messages"""
        return self.queryset.model._meta.verbose_name.title() if hasattr(self, 'queryset') else "Resource"