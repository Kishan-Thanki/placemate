"""
Custom Pagination for the Placemate Project.

This module provides a standardized pagination class that integrates with the custom API response format defined in `apps.core.response`. 
Its primary purpose is to ensure that all paginated list endpoints in the API return data in a consistent and predictable structure.
"""
from apps.core.response import PaginatedResponse
from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    """
    A custom pagination class that formats the response to match the project's standard API response structure.

    It overrides the default `get_paginated_response` method to use the
    custom `PaginatedResponse` class, which includes keys like 'success',
    'message', 'data', and 'pagination'.
    """
    # The default number of items to include on a page.
    page_size = 20
    
    # The name of the query parameter that allows the client to override the page size.
    # e.g., /api/v1/jobs/?page_size=50
    page_size_query_param = 'page_size'
    
    # The maximum page size that a client is allowed to request.
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Overrides the default paginated response format.

        This method is called by the viewset's list action. 
        It constructs a dictionary of pagination metadata and passes it, along with the data,
        to the custom `PaginatedResponse` class.

        Args:
            data (list): A list of serialized data for the current page.

        Returns:
            PaginatedResponse: An instance of our custom response class, 
                               which will render the final, standardized JSON output.
        """
        # A dictionary containing all the metadata for the paginated response.
        pagination_data = {
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'page_size': self.get_page_size(self.request)
        }
        
        # Return our custom response class, which will format the final JSON.
        return PaginatedResponse(
            data=data,
            pagination_data=pagination_data,
            message="Data retrieved successfully"
        )
    
    def get_paginated_response_schema(self, schema):
        """
        Overrides the default schema for paginated responses.

        This method is used by API documentation tools like drf-yasg to generate
        an accurate and detailed schema for paginated endpoints, 
        showing the exact structure of the success and pagination objects.

        Args:
            schema (dict): The base schema for the serialized data.

        Returns:
            dict: A dictionary representing the OpenAPI/Swagger schema for the response.
        """
        return {
            'type': 'object',
            'properties': {
                'success': {
                    'type': 'boolean',
                    'example': True
                },
                'message': {
                    'type': 'string', 
                    'example': 'Data retrieved successfully'
                },
                'timestamp': {
                    'type': 'string',
                    'format': 'date-time'
                },
                'data': schema,
                'pagination': {
                    'type': 'object',
                    'properties': {
                        'count': {
                            'type': 'integer',
                            'example': 100
                        },
                        'next': {
                            'type': 'string',
                            'nullable': True,
                            'example': 'http://api.example.com/endpoint?page=3'
                        },
                        'previous': {
                            'type': 'string', 
                            'nullable': True,
                            'example': 'http://api.example.com/endpoint?page=1'
                        },
                        'current_page': {
                            'type': 'integer',
                            'example': 2
                        },
                        'total_pages': {
                            'type': 'integer',
                            'example': 5
                        },
                        'page_size': {
                            'type': 'integer',
                            'example': 20
                        }
                    }
                }
            }
        }