"""
Custom API Permission Classes for the Placemate Project.
Simplified version without helper function.
"""

from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'company') and hasattr(obj.company, 'user'):
             return obj.company.user == request.user

        return False


class IsStudentRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Get active_role from JWT token
        jwt_active_role = self._get_active_role(request)
        has_student_role_db = request.user.roles.filter(name='Student').exists()
        
        return jwt_active_role == 'Student' and has_student_role_db
    
    def _get_active_role(self, request):
        if not hasattr(request, 'auth') or not request.auth:
            return None
        if hasattr(request.auth, 'payload'):
            return request.auth.payload.get('active_role')
        elif hasattr(request.auth, 'get'):
            return request.auth.get('active_role')
        return None


class IsPlacementTeam(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        jwt_active_role = self._get_active_role(request)
        has_placement_role_db = request.user.roles.filter(name='Student Placement Cell').exists()
        
        return jwt_active_role == 'Student Placement Cell' and has_placement_role_db
    
    def _get_active_role(self, request):
        if not hasattr(request, 'auth') or not request.auth:
            return None
        if hasattr(request.auth, 'payload'):
            return request.auth.payload.get('active_role')
        elif hasattr(request.auth, 'get'):
            return request.auth.get('active_role')
        return None


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        jwt_active_role = self._get_active_role(request)
        has_admin_role_db = request.user.roles.filter(name='Admin').exists()
        
        return jwt_active_role == 'Admin' and has_admin_role_db
    
    def _get_active_role(self, request):
        if not hasattr(request, 'auth') or not request.auth:
            return None
        if hasattr(request.auth, 'payload'):
            return request.auth.payload.get('active_role')
        elif hasattr(request.auth, 'get'):
            return request.auth.get('active_role')
        return None


class IsAdminOrPlacementTeamRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        jwt_active_role = self._get_active_role(request)
        
        if jwt_active_role == 'Admin':
            return request.user.roles.filter(name='Admin').exists()
        elif jwt_active_role == 'Student Placement Cell':
            return request.user.roles.filter(name='Student Placement Cell').exists()
        
        return request.user.roles.filter(
            name__in=['Admin', 'Student Placement Cell']
        ).exists()
    
    def _get_active_role(self, request):
        if not hasattr(request, 'auth') or not request.auth:
            return None
        if hasattr(request.auth, 'payload'):
            return request.auth.payload.get('active_role')
        elif hasattr(request.auth, 'get'):
            return request.auth.get('active_role')
        return None