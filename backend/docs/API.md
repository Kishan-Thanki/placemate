# API Reference

Complete API documentation for Placemate Backend.

## Base URL

```
http://localhost:8000/api/v1/  # Local development
https://placemate-cnc3.onrender.com/api/v1/  # Production
```

## Authentication

### Overview

Placemate uses JWT (JSON Web Token) authentication with HTTP-only cookies for enhanced security. Tokens are automatically sent with each request via cookies.

### Authentication Endpoints

#### Login

```http
POST /api/v1/token/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Single Role):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "active_role": "Student"
  }
}
```

**Response (Multiple Roles):**
```json
{
  "success": true,
  "message": "Select role to continue",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "available_roles": ["Admin", "Student"],
    "requires_role_selection": true
  }
}
```

**Cookies Set:**
- `access_token` (HTTP-only, Secure in production)
- `refresh_token` (HTTP-only, Secure in production)

#### Select Role (Multi-Role Users)

```http
POST /api/v1/auth/select-role/
Content-Type: application/json

{
  "role": "Student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "active_role": "Student"
  }
}
```

#### Refresh Token

```http
POST /api/v1/token/refresh/
```

**Response:**
- New `access_token` and `refresh_token` cookies set

#### Logout

```http
POST /api/v1/logout/
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
- `access_token`
- `refresh_token`

## Standard Response Format

All API responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-01T12:00:00Z",
  "error_code": "ERROR_CODE",
  "errors": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": [ ... ],
  "pagination": {
    "count": 100,
    "next": "http://api.example.com/endpoint?page=3",
    "previous": "http://api.example.com/endpoint?page=1",
    "current_page": 2,
    "total_pages": 5,
    "page_size": 20
  }
}
```

## API Endpoints

### Authentication (`/api/v1/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/token/` | Login | No |
| POST | `/token/refresh/` | Refresh token | No |
| POST | `/auth/select-role/` | Select role for multi-role users | No |
| POST | `/logout/` | Logout | Yes |

### Users (`/api/v1/users/`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/register/` | Admin user registration | Admin |
| GET | `/me/` | Current user profile | Authenticated |
| PATCH | `/me/` | Update current user profile | Authenticated |
| GET | `/manage/` | List users | Admin |
| GET | `/manage/{id}/` | User details | Admin |
| PATCH | `/manage/{id}/roles/` | Update user roles | Admin |
| PATCH | `/manage/{id}/activation/` | Activate/deactivate user | Admin |
| DELETE | `/manage/{id}/` | Delete user | Admin |

### Students (`/api/v1/students/`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/register/` | Admin student registration | Admin |
| GET | `/me/` | Current student profile | Student |
| PATCH | `/me/` | Update student profile | Student |
| GET | `/profiles/` | List students | Admin/Placement |
| GET | `/profiles/{user_id}/` | Student details | Admin/Placement |
| PATCH | `/profiles/{user_id}/` | Update student | Admin |
| PATCH | `/profiles/{user_id}/mark_as_placed/` | Mark as placed | Admin |

### Companies (`/api/v1/companies/`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List companies | Authenticated |
| GET | `/{id}/` | Company details | Authenticated |
| POST | `/` | Create company | Admin |
| PATCH | `/{id}/` | Update company | Admin |
| DELETE | `/{id}/` | Delete company | Admin |

### Placements (`/api/v1/placements/`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/placement-drives/` | List drives | Admin |
| POST | `/placement-drives/` | Create drive | Admin |
| GET | `/company-drives/` | List company drives | Authenticated |
| POST | `/company-drives/` | Create company drive with jobs | Admin |
| GET | `/company-drives/{id}/jobs/` | Get jobs for drive | Authenticated |
| GET | `/jobs/` | List jobs | Authenticated |
| POST | `/jobs/` | Create job | Admin |

**Note:** Students only see "Open" drives and jobs.

### Applications (`/api/v1/applications/`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List applications | Varies |
| POST | `/` | Create application | Student |
| GET | `/{id}/` | Application details | Varies |
| POST | `/{id}/withdraw/` | Withdraw application | Student |
| POST | `/{id}/accept_offer/` | Accept job offer | Student |
| POST | `/{id}/decline_offer/` | Decline job offer | Student |
| POST | `/{id}/offer_job/` | Offer job to student | Admin/Placement |
| POST | `/{id}/reject/` | Reject application | Admin/Placement |

**Note:** Students only see their own applications. Admin/Placement see all.

### Core (`/api/v1/core/`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/lookup/?type=countries` | Get countries | Authenticated |
| GET | `/lookup/?type=states&parent_id=1` | Get states by country | Authenticated |
| GET | `/lookup/?type=cities&parent_id=1` | Get cities by state | Authenticated |
| GET | `/lookup/?type=degrees` | Get degrees | Authenticated |
| GET | `/lookup/?type=programs&parent_id=1` | Get programs by degree | Authenticated |

### Password Reset (`/api/v1/password-reset/`)

Uses `django_rest_passwordreset` library. See library documentation for endpoints.

## Authentication & Authorization

### Permission Classes

1. **IsAdminRole**: Active role must be "Admin"
2. **IsStudentRole**: Active role must be "Student"
3. **IsPlacementTeam**: Active role must be "Admin" OR "Student Placement Cell"
4. **IsOwnerOrReadOnly**: Read (any authenticated), Write (owner OR Admin)

### Permission Flow

1. JWT contains `active_role` claim
2. Permission class extracts `active_role` from token
3. Validates role against required roles
4. **Security Check**: Verifies user actually has role in database (prevents token tampering)

### Default Policy

- **All endpoints require authentication** (IsAuthenticated) unless explicitly AllowAny
- Public endpoints: `/api/v1/token/`, `/api/v1/token/refresh/`, `/api/v1/auth/select-role/`

## Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

### Filtering

Many endpoints support filtering via query parameters. See individual endpoint documentation.

### Examples

```http
GET /api/v1/students/profiles/?program=1&is_placed=false&search=john
GET /api/v1/placements/company-drives/?status=Open&drive_type=FullTime
GET /api/v1/applications/?status=Applied&company_drive=1
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `THROTTLED` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

## Rate Limiting

- Anonymous: 50 requests/hour
- Authenticated: 1000 requests/hour

## API Documentation

Interactive API documentation available at:

- Swagger UI: `http://localhost:8000/docs/api/`
- ReDoc: `http://localhost:8000/redoc/`

## Examples

### Example: Create Application

```http
POST /api/v1/applications/
Content-Type: application/json
Cookie: access_token=...

{
  "company_drive": 1,
  "resume": "resume_url_or_id",
  "job_preferences": [
    {
      "job": 1,
      "preference_order": 1
    },
    {
      "job": 2,
      "preference_order": 2
    }
  ]
}
```

### Example: Offer Job to Student

```http
POST /api/v1/applications/1/offer_job/
Content-Type: application/json
Cookie: access_token=...

{
  "job_id": 5
}
```

### Example: List Students with Filters

```http
GET /api/v1/students/profiles/?program=1&is_placed=false&search=john&page=1&page_size=10
Cookie: access_token=...
```

## Support

For API issues or questions:
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Architecture Documentation](ARCHITECTURE.md)
- Create a GitHub issue
