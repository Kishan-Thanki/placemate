"""
Custom API Permission Classes for the Placemate Project.

This module defines a set of custom, reusable permission classes that can be applied to API views to enforce specific business logic and access control rules.
These classes work in conjunction with Django's built-in authentication and the project's Role-Based Access Control (RBAC) system.

PERMISSION HIERARCHY:
====================
1. IsOwnerOrReadOnly    : Object-level ownership (students edit own data)
2. IsStudentRole        : Student-specific access
3. IsPlacementTeam      : Role-based access (Admin + Student Placement Cell)
4. IsAdminRole          : Strict admin-only access (Admin role required)
5. IsAdminOrPlacementTeamRole : Combined admin/placement team access

USAGE EXAMPLES:
==============
@permission_classes([IsAuthenticated, IsOwnerOrReadOnly])  # Student profile
@permission_classes([IsAuthenticated, IsPlacementTeam])    # Placement operations  
@permission_classes([IsAuthenticated, IsAdminRole])        # User registration
"""
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    An object-level permission to only allow owners of an object to edit it.

    This rule grants read-only access (GET, HEAD, OPTIONS) to any authenticated user, 
    but restricts write access (POST, PUT, PATCH, DELETE) to the user who is directly associated with the object.

    USAGE: Student profiles, company drives, user-specific data
    ACCESS: Read - any authenticated user, Write - object owner only
    
    SUPPORTED OBJECT STRUCTURES:
    - obj.user == request.user (direct ownership)
    - obj.company.user == request.user (company ownership)
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
        
        # fallback
        if hasattr(obj, 'company') and hasattr(obj.company, 'user'):
             return obj.company.user == request.user

        return False


class IsStudentRole(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'Student' role.
    
    USAGE: Student-specific operations, profile access
    ACCESS: Users with 'Student' role only
    
    ROLES: ['Student']
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.roles.filter(name='Student').exists()


class IsPlacementTeam(permissions.BasePermission):
    """
    Allows access to users who are part of the placement team.
    
    USAGE: General placement operations, student management, drive coordination
    ACCESS: Users with 'Admin' OR 'Student Placement Cell' roles
    
    ROLES: ['Admin', 'Student Placement Cell']
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.roles.filter(
            name__in=['Admin', 'Student Placement Cell']
        ).exists()


class IsAdminRole(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'Admin' role.
    
    USAGE: Top-level administrative actions, user registration, system configuration
    ACCESS: Users with 'Admin' role only (most restrictive)
    
    ROLES: ['Admin']
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.roles.filter(name='Admin').exists()


class IsAdminOrPlacementTeamRole(permissions.BasePermission):
    """
    Allows access to users with either Admin OR Placement Team roles.
    
    USAGE: Administrative student management, placement operations
    ACCESS: Users with 'Admin' OR 'Student Placement Cell' roles
    
    ROLES: ['Admin', 'Student Placement Cell']
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.roles.filter(
            name__in=['Admin', 'Student Placement Cell']
        ).exists()