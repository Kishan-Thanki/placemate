"""
Custom API Permission Classes for the Placemate Project.

This module defines a set of custom, reusable permission classes that can be applied to API views to enforce specific business logic and access control rules.
These classes work in conjunction with Django's built-in authentication and the project's Role-Based Access Control (RBAC) system.
"""
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    An object-level permission to only allow owners of an object to edit it.

    This rule grants read-only access (GET, HEAD, OPTIONS) to any authenticated user, 
    but restricts write access (POST, PUT, PATCH, DELETE) to the user who is directly associated with the object.

    It assumes the object has a `user` attribute that links to a User instance.
    """
    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS are read-only methods (GET, HEAD, OPTIONS) that do not modify the data. 
        # We allow any authenticated user to perform these.
        if request.method in permissions.SAFE_METHODS:
            return True

        # For write methods (PUT, PATCH, DELETE), we check if the user making the request is the same as the user associated with the object.
        # This is used, for example, to ensure a student can only edit their own profile.
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # This is a fallback for models like CompanyDrive that are linked to a Company,
        # which is in turn linked to a user.
        if hasattr(obj, 'company') and hasattr(obj.company, 'user'):
             return obj.company.user == request.user

        return False


class IsPlacementTeam(permissions.BasePermission):
    """
    A view-level permission to only allow placement team members to access an endpoint.

    This rule checks if the logged-in user is authenticated and has a role that
    is part of the placement team (e.g., "Placement Head" or "Placement Student Member").
    """
    def has_permission(self, request, view):
        # First, ensure the user is logged in.
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Check if the user's roles set has any intersection with the list of placement team roles. 
        # The `__in` lookup is an efficient way to do this.
        return request.user.roles.filter(
            name__in=['Placement Head', 'Placement Student Member']
        ).exists()