# apps/core/tests/test_permissions.py
"""
TEST SUITE: Core App - Permission Classes
Test Suite ID: CORE-PERMISSIONS-001

This suite tests the custom permission classes that enforce our
"Active Role" security model.
"""
from django.test import TestCase, RequestFactory
from unittest.mock import Mock, patch
from apps.core.permissions import (
    IsAdminRole, IsPlacementTeam, IsStudentRole, IsOwnerOrReadOnly,
    _get_active_role
)

# apps/core/tests/test_permissions.py
class PermissionHelperTest(TestCase):
    """
    TEST SUITE: Permission Helper Functions
    Test Suite ID: CORE-PERMISSIONS-001-001
    """
    
    def test_get_active_role_from_token_payload(self):
        """
        Test Case ID: CORE-PERMISSIONS-001-001-001
        Module: Core App - _get_active_role helper
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify active role extraction from JWT token
        Preconditions: Mock request with auth payload
        
        Test Steps:
        1. Create mock request with token payload
        2. Call _get_active_role function
        3. Verify correct role extraction
        
        Expected Results:
        - Returns active_role from token payload
        - Handles both simple-jwt >=6.0 and <6.0 formats
        - Returns None if no auth data
        """
        from apps.core.permissions import _get_active_role
        
        # Test Case 1: simple-jwt >=6.0 format with payload containing active_role
        request = Mock()
        request.auth = Mock()
        request.auth.payload = {'active_role': 'Admin'}
        
        role = _get_active_role(request)
        self.assertEqual(role, 'Admin')
        
        # Test Case 2: simple-jwt >=6.0 format with payload but no active_role
        request = Mock()
        request.auth = Mock()
        request.auth.payload = {'other_field': 'value'}
        
        role = _get_active_role(request)
        self.assertIsNone(role)
        
        # Test Case 3: simple-jwt >=6.0 format with None payload - THIS IS THE FIXED CASE
        request = Mock()
        request.auth = Mock()
        request.auth.payload = None  # This was causing the error
        request.auth.get = Mock(return_value='Student')  # Should fallback to get method
        
        role = _get_active_role(request)
        self.assertEqual(role, 'Student')
        
        # Test Case 4: simple-jwt <6.0 format (no payload attribute)
        request = Mock()
        request.auth = Mock(spec=[])  # Mock without payload attribute
        # Add get method manually since we're using spec=[]
        request.auth.get = Mock(return_value='Student Placement Cell')
        
        role = _get_active_role(request)
        self.assertEqual(role, 'Student Placement Cell')
        request.auth.get.assert_called_once_with('active_role')
        
        # Test Case 5: simple-jwt <6.0 format but no active_role
        request = Mock()
        request.auth = Mock(spec=[])
        request.auth.get = Mock(return_value=None)
        
        role = _get_active_role(request)
        self.assertIsNone(role)
        
        # Test Case 6: No auth at all
        request = Mock()
        request.auth = None
        
        role = _get_active_role(request)
        self.assertIsNone(role)
        
        # Test Case 7: Auth exists but no get method (edge case)
        request = Mock()
        request.auth = Mock(spec=[])  # Mock without any methods
        
        role = _get_active_role(request)
        self.assertIsNone(role)
        
        # Test Case 8: No auth attribute on request
        request = Mock()
        del request.auth  # Remove auth attribute entirely
        
        role = _get_active_role(request)
        self.assertIsNone(role)

class BaseRolePermissionTest(TestCase):
    """
    TEST SUITE: Base Role Permission Class
    Test Suite ID: CORE-PERMISSIONS-001-002
    """
    
    def setUp(self):
        self.factory = RequestFactory()
        self.user = Mock()
        self.user.is_authenticated = True
        self.user.roles = Mock()
        self.user.roles.filter.return_value.exists.return_value = True
    
    @patch('apps.core.permissions._get_active_role')
    def test_admin_role_permission(self, mock_get_role):
        """
        Test Case ID: CORE-PERMISSIONS-001-002-001
        Module: Core App - IsAdminRole Permission
        Test Type: Unit Test
        Priority: Critical
        
        Objective: Verify only users with Admin active role can access
        Preconditions: Mock user and role data
        
        Test Steps:
        1. Mock active role as 'Admin'
        2. Check has_permission with IsAdminRole
        3. Verify access granted for Admin role
        
        Expected Results:
        - Returns True for Admin active role
        - User must be authenticated
        - User must actually have Admin role in database
        """
        mock_get_role.return_value = 'Admin'
        permission = IsAdminRole()
        request = Mock()
        request.user = self.user
        
        result = permission.has_permission(request, None)
        
        self.assertTrue(result)
        mock_get_role.assert_called_once_with(request)
        self.user.roles.filter.assert_called_once_with(name='Admin')
    
    @patch('apps.core.permissions._get_active_role')
    def test_placement_team_permission_multiple_roles(self, mock_get_role):
        """
        Test Case ID: CORE-PERMISSIONS-001-002-002
        Module: Core App - IsPlacementTeam Permission
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify both Admin and Student Placement Cell roles can access
        Preconditions: Mock user and role data
        
        Test Steps:
        1. Test with 'Admin' active role
        2. Test with 'Student Placement Cell' active role
        3. Test with invalid role
        
        Expected Results:
        - Returns True for both Admin and Student Placement Cell
        - Returns False for other roles
        - Verifies database role existence
        """
        permission = IsPlacementTeam()
        request = Mock()
        request.user = self.user
        
        # Test Admin role
        mock_get_role.return_value = 'Admin'
        self.assertTrue(permission.has_permission(request, None))
        
        # Test Student Placement Cell role
        mock_get_role.return_value = 'Student Placement Cell'
        self.assertTrue(permission.has_permission(request, None))
        
        # Test invalid role
        mock_get_role.return_value = 'Student'
        self.assertFalse(permission.has_permission(request, None))
    
    @patch('apps.core.permissions._get_active_role')
    def test_permission_denied_for_unauthenticated(self, mock_get_role):
        """
        Test Case ID: CORE-PERMISSIONS-001-002-003
        Module: Core App - Base Role Permissions
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify unauthenticated users are denied access
        Preconditions: User is not authenticated
        
        Test Steps:
        1. Create unauthenticated user
        2. Check permission with any role permission
        3. Verify access denied
        
        Expected Results:
        - Returns False for unauthenticated users
        - _get_active_role is not called
        """
        permission = IsAdminRole()
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False
        
        result = permission.has_permission(request, None)
        
        self.assertFalse(result)
        mock_get_role.assert_not_called()

class IsOwnerOrReadOnlyTest(TestCase):
    """
    TEST SUITE: IsOwnerOrReadOnly Permission
    Test Suite ID: CORE-PERMISSIONS-001-003
    """
    
    def setUp(self):
        self.permission = IsOwnerOrReadOnly()
        self.request = Mock()
        self.request.user = Mock()
        self.request.method = 'GET'  # Safe method by default
    
    @patch('apps.core.permissions._get_active_role')
    def test_safe_methods_allowed(self, mock_get_role):
        """
        Test Case ID: CORE-PERMISSIONS-001-003-001
        Module: Core App - IsOwnerOrReadOnly Permission
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify read-only methods are allowed for all authenticated users
        Preconditions: User is authenticated, using safe HTTP method
        
        Test Steps:
        1. Set request method to GET (safe method)
        2. Check object permission
        3. Verify access granted
        
        Expected Results:
        - Returns True for safe methods (GET, HEAD, OPTIONS)
        - Works regardless of object ownership
        """
        obj = Mock()
        
        result = self.permission.has_object_permission(self.request, None, obj)
        
        self.assertTrue(result)
        mock_get_role.assert_not_called()  # Should not check roles for safe methods
    
    @patch('apps.core.permissions._get_active_role')
    def test_admin_override_for_write_operations(self, mock_get_role):
        """
        Test Case ID: CORE-PERMISSIONS-001-003-002
        Module: Core App - IsOwnerOrReadOnly Permission
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify Admin users can edit any object
        Preconditions: User has Admin active role, using unsafe method
        
        Test Steps:
        1. Set request method to POST (unsafe method)
        2. Mock user as Admin
        3. Check object permission
        4. Verify access granted via admin override
        
        Expected Results:
        - Returns True for Admin users regardless of ownership
        - Verifies Admin role in database
        """
        self.request.method = 'POST'  # Unsafe method
        mock_get_role.return_value = 'Admin'
        self.request.user.roles.filter.return_value.exists.return_value = True
        
        obj = Mock()
        
        result = self.permission.has_object_permission(self.request, None, obj)
        
        self.assertTrue(result)
        mock_get_role.assert_called_once_with(self.request)
    
    @patch('apps.core.permissions._get_active_role')
    def test_owner_access_for_write_operations(self, mock_get_role):
        """
        Test Case ID: CORE-PERMISSIONS-001-003-003
        Module: Core App - IsOwnerOrReadOnly Permission
        Test Type: Unit Test
        Priority: High
        
        Objective: Verify object owners can edit their own objects
        Preconditions: User is object owner, not Admin, using unsafe method
        
        Test Steps:
        1. Set request method to PATCH (unsafe method)
        2. Mock user as not Admin but object owner
        3. Check object permission
        4. Verify access granted via ownership
        
        Expected Results:
        - Returns True when user owns the object
        - Checks object.user == request.user
        """
        self.request.method = 'PATCH'  # Unsafe method
        mock_get_role.return_value = 'Student'  # Not Admin
        self.request.user.roles.filter.return_value.exists.return_value = False
        
        obj = Mock()
        obj.user = self.request.user  # User owns the object
        
        result = self.permission.has_object_permission(self.request, None, obj)
        
        self.assertTrue(result)