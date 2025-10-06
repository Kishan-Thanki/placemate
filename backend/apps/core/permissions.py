from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Assumes the model instance has a `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'company') and hasattr(obj.company, 'user'):
             return obj.company.user == request.user

        return False


class IsPlacementTeam(permissions.BasePermission):
    """
    Custom permission to only allow placement team members to access an endpoint.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        return request.user.roles.filter(
            name__in=['Placement Head', 'Placement Student Member']
        ).exists()