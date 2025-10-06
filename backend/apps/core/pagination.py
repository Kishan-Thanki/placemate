from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from apps.core.response import PaginatedResponse

class StandardPagination(PageNumberPagination):
    """
    Standard pagination format for all list endpoints
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        pagination_data = {
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'page_size': self.get_page_size(self.request)
        }
        
        return PaginatedResponse(
            data=data,
            pagination_data=pagination_data,
            message="Data retrieved successfully"
        )
    
    def get_paginated_response_schema(self, schema):
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