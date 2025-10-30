"""
Custom API Permission Classes for the Placemate Project.

This module defines a set of custom, reusable permission classes that enforce
our "Active Role" security model. This is the single source of truth for
all business logic and access control rules.

PERMISSION HIERARCHY:
====================
1. IsOwnerOrReadOnly    : Object-level ownership (students edit own data) OR Admin override.
2. IsStudentRole        : Active role must be 'Student'.
3. IsPlacementTeam      : Active role must be 'Admin' OR 'Student Placement Cell'.
4. IsAdminRole          : Active role must be 'Admin'.
"""
from rest_framework import permissions

def _get_active_role(request):
    """
    A central helper function to safely extract the 'active_role'
    claim from the user's validated JWT payload.
    """
    # request.auth is the validated token payload set by CookieJWTAuthentication
    if not hasattr(request, 'auth') or not request.auth:
        return None
        
    if hasattr(request.auth, 'payload'):
        # For simple-jwt >= 6.0
        return request.auth.payload.get('active_role')
    elif hasattr(request.auth, 'get'):
        # For simple-jwt < 6.0
        return request.auth.get('active_role')
    return None

class BaseRolePermission(permissions.BasePermission):
    """
    A base class for our role permissions that checks the user's
    *active* role from the JWT against a list of required roles.
    """
    required_roles = [] # This will be overridden by child classes

    def has_permission(self, request, view):
        # 1. User must be logged in.
        if not (request.user and request.user.is_authenticated):
            return False
        
        # 2. Get the active role from the token (e.g., "Student").
        active_role = _get_active_role(request)
        if not active_role:
            return False

        # 3. Check if the active role is one of the roles allowed for this endpoint.
        if active_role not in self.required_roles:
            return False
            
        # 4. Final security check: Verify the user *actually has* this role
        #    in the database to prevent a user from faking a token.
        return request.user.roles.filter(name=active_role).exists()

class IsAdminRole(BaseRolePermission):
    """
    Allows access only if the user's active role is 'Admin'.
    Used for the most sensitive, top-level administrative actions.
    """
    required_roles = ['Admin']

class IsPlacementTeam(BaseRolePermission):
    """
    Allows access if the user's active role is 'Admin' OR 'Student Placement Cell'.
    Used for general placement-related tasks.
    """
    required_roles = ['Admin', 'Student Placement Cell']

class IsStudentRole(BaseRolePermission):
    """
    Allows access only if the user's active role is 'Student'.
    Used for student-specific dashboards and actions.
    """
    required_roles = ['Student']

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    An object-level permission that allows read-only access to anyone,
    but write access only to the object's owner OR an active Admin.
    """
    def has_object_permission(self, request, view, obj):
        # Read-only methods (GET, HEAD, OPTIONS) are allowed by any authenticated user.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Check for Admin override: An active Admin can edit any object.
        active_role = _get_active_role(request)
        if active_role == 'Admin' and request.user.roles.filter(name='Admin').exists():
            return True

        # If not an Admin, check if the user is the direct owner.
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Fallback for company-owned objects.
        if hasattr(obj, 'company') and hasattr(obj.company, 'user'):
             return obj.company.user == request.user

        return False