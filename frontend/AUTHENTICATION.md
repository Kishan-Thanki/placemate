# Role-Based Authentication Implementation

## Overview

This document explains the role-based authentication system implemented in Placemate frontend.

## Authentication Flow

### 1. Login Process

#### Single Role User

When a user with a single role logs in:

1. User enters email and password
2. POST request to `https://placemate-88qn.onrender.com/api/v1/token/`
3. Backend returns user data with `requires_role_selection: false`
4. User is directly logged in and redirected to their dashboard

#### Multiple Role User

When a user with multiple roles (e.g., both Student and SPC member) logs in:

1. User enters email and password
2. POST request to `https://placemate-88qn.onrender.com/api/v1/token/`
3. Backend returns:
   ```json
   {
     "success": true,
     "message": "Select role to continue",
     "data": {
       "user_id": 29,
       "email": "user@example.com",
       "first_name": "John",
       "available_roles": ["Student Placement Cell", "Student"],
       "requires_role_selection": true
     }
   }
   ```
4. Role selection modal appears
5. User selects a role
6. POST request to `https://placemate-88qn.onrender.com/api/v1/users/auth/select-role/`
   ```json
   {
     "user_id": 29,
     "role": "Student"
   }
   ```
7. User is logged in with selected role and redirected

### 2. Role-Based Routing

#### Admin Dashboard

- **Path**: `/admin/*`
- **Allowed Roles**: `Admin`, `Student Placement Cell`
- Users with SPC role have full access to admin dashboard (temporary)

#### Student Dashboard

- **Path**: `/student/*`
- **Allowed Roles**: `Student`
- Only students can access this dashboard

### 3. Role Switching

Users with multiple roles can switch between them using the `RoleSwitcher` component:

- Located in the Sidebar footer
- Only visible to users with multiple roles
- Clicking a role sends a request to the select-role API
- User is redirected to the appropriate dashboard after switching

## Components

### LoginPage (`/pages/auth/LoginPage.jsx`)

Handles the login flow and role selection:

- Manages login form submission
- Shows role selection modal when needed
- Handles successful login and redirection

### RoleSelectionModal (`/components/RoleSelectionModal.jsx`)

Modal for selecting a role when user has multiple roles:

- Displays available roles with icons and descriptions
- Handles role selection
- Shows loading state during selection

### RoleSwitcher (`/components/RoleSwitcher.jsx`)

Dropdown component for switching between roles:

- Only shown to users with multiple roles
- Located in the Sidebar
- Allows quick role switching without logout

### ProtectedRoute (`/components/ProtectedRoute.jsx`)

Route guard component:

- Checks if user is authenticated
- Verifies user has required role(s)
- Redirects to home if unauthorized

### AuthContext (`/contexts/AuthContext.jsx`)

Manages authentication state:

- Stores user data in localStorage
- Provides login/logout functions
- Provides role checking utilities

## Role Checking Utilities

The AuthContext provides several utility functions:

```javascript
// Check if user has a specific role (in their available roles)
hasRole("Student"); // true if user has Student role

// Check if a role is currently active
isActiveRole("Admin"); // true if Admin is active role

// Check if user has any of the given roles
hasAnyRole(["Admin", "Student Placement Cell"]); // true if user has at least one

// Quick access checks
canAccessAdminPanel(); // true for Admin or SPC
canAccessStudentPanel(); // true for Student
```

## Token Management

**Important: Tokens are stored as httpOnly cookies by the backend, NOT in localStorage!**

This is a more secure approach because:

- JavaScript cannot access httpOnly cookies (prevents XSS attacks)
- Cookies are automatically sent with every request to the backend
- No need to manually add Authorization headers
- Tokens are protected from client-side script access

### How it works:

1. **Login**: Backend sets `access_token` and `refresh_token` as httpOnly cookies in the response
2. **API Requests**: Cookies are automatically sent with every request using `credentials: 'include'`
3. **Logout**: Backend clears the cookies from the browser

### User Data Storage:

Only user profile data is stored in localStorage (NOT tokens):

```javascript
{
  id: 29,
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  roles: ["Admin", "Student"],
  activeRole: "Admin"
}
```

**Security Note**: Access and refresh tokens are NOT accessible via JavaScript for security reasons.

## API Endpoints

### Login

- **URL**: `https://placemate-88qn.onrender.com/api/v1/token/`
- **Method**: POST
- **Body**: `{ email, password }`

### Select Role

- **URL**: `https://placemate-88qn.onrender.com/api/v1/users/auth/select-role/`
- **Method**: POST
- **Body**: `{ user_id, role }`

## Security Considerations

1. **Case-Insensitive Role Matching**: All role comparisons are case-insensitive
2. **Protected Routes**: All sensitive routes are wrapped with ProtectedRoute
3. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
4. **Role Validation**: Backend validates role selection and access

## Future Improvements

1. **SPC Permissions**: Limit SPC access to specific admin features
2. **Role History**: Track role switching history
3. **Auto Role Selection**: Remember last selected role for multi-role users
4. **Token Refresh**: Implement automatic token refresh
5. **Secure Storage**: Move to httpOnly cookies for token storage
