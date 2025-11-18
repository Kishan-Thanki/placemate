# Placemate Backend - Comprehensive Understanding Document

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Application Structure](#application-structure)
4. [Authentication & Authorization](#authentication--authorization)
5. [Models & Data Flow](#models--data-flow)
6. [API Endpoints](#api-endpoints)
7. [Business Logic](#business-logic)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Technology Stack
- **Framework**: Django 5.2.6 + Django REST Framework 3.16.1
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT (Simple JWT) with HTTP-only cookies
- **File Storage**: Cloudinary (production) / Local filesystem (development)
- **Email**: Brevo (via django-anymail)
- **Deployment**: Render (Gunicorn + WhiteNoise)

### Key Design Patterns
1. **Cookie-based JWT Authentication** - Secure token storage in HTTP-only cookies
2. **Role-Based Access Control (RBAC)** - Multi-role user system with active role selection
3. **Standardized API Responses** - Consistent JSON structure across all endpoints
4. **Custom Exception Handling** - Centralized error formatting
5. **BaseViewSet Pattern** - Reusable CRUD operations with custom responses

---

## Core Components

### 1. Core App (`apps/core/`)

#### Models
- **Country, State, City**: Hierarchical location data
- **Degree, Program**: Academic program management with degree levels (UG/PG/Doctorate)

#### Key Files
- **`models.py`**: Lookup data models (Country, State, City, Degree, Program)
- **`views.py`**: 
  - `BaseViewSet`: Standardized CRUD ViewSet with custom responses
  - `LookupAPI`: Unified endpoint for dropdown data (`/core/lookup/?type=countries|states|cities|degrees|programs`)
- **`response.py`**: Standardized API response classes (SuccessResponse, ErrorResponse, etc.)
- **`pagination.py`**: Custom pagination with standardized format
- **`permissions.py`**: Role-based permission classes (IsAdminRole, IsStudentRole, IsPlacementTeam, IsOwnerOrReadOnly)
- **`exception_handler.py`**: Global exception handler for consistent error formatting
- **`exceptions.py`**: Custom exception classes
- **`middleware.py`**: Security headers middleware
- **`utils.py`**: Email sending utility
- **`tasks.py`**: Background email tasks
- **`cookies.py`**: Cookie configuration helper

#### Features
- Unified lookup API for frontend dropdowns
- Standardized pagination (20 items/page, max 100)
- Security headers (XSS protection, frame options, etc.)
- Background email processing

---

### 2. Users App (`apps/users/`)

#### Models
- **User**: Custom user model (email-based, phone_number required)
  - Fields: email, phone_number, first_name, middle_name, last_name, secondary_email, alternate_phone
  - Many-to-many relationship with Role
- **Role**: Permission-based roles (Admin, Student, Student Placement Cell, etc.)
  - Many-to-many with Django Permission model

#### Key Files
- **`models.py`**: User and Role models, UserManager with random password generation
- **`authentication.py`**: `CookieJWTAuthentication` - JWT from HTTP-only cookies
- **`serializers.py`**: 
  - `LoginUserSerializer`: Credential validation
  - `UserRegistrationSerializer`: Admin user creation with roles
  - `UserSerializer`: Profile management
  - `UserRoleUpdateSerializer`: Role management
- **`views/auth_views.py`**:
  - `LoginView`: POST `/api/v1/token/` - Issues JWT with roles, handles multi-role selection
  - `LoginRoleView`: POST `/api/v1/auth/select-role/` - Role selection for multi-role users
  - `MyTokenRefreshView`: POST `/api/v1/token/refresh/` - Token refresh from cookies
  - `LogoutView`: POST `/api/v1/logout/` - Blacklist token, clear cookies
- **`views/profile_views.py`**:
  - `CurrentUserView`: GET/PATCH `/api/v1/users/me/` - Current user profile
- **`views/admin_views.py`**:
  - `UserRegistrationView`: POST `/api/v1/users/register/` - Admin user registration
  - `UserViewSet`: Full CRUD + role management + activation
- **`signals.py`**: Password reset email handler
- **`admin.py`**: Custom admin with password generation and welcome emails

#### Authentication Flow
1. User logs in → `LoginView` validates credentials
2. If single role → JWT issued immediately with `active_role` claim
3. If multiple roles → Returns role selection prompt
4. User selects role → `LoginRoleView` issues JWT with selected `active_role`
5. JWT stored in HTTP-only cookies (`access_token`, `refresh_token`)
6. Subsequent requests → `CookieJWTAuthentication` validates token from cookies

#### Security Features
- HTTP-only cookies prevent XSS attacks
- Refresh token blacklisting on logout
- Role validation in permissions (checks both token claim and database)
- Random password generation for new users
- Welcome emails sent in background

---

### 3. Students App (`apps/students/`)

#### Models
- **StudentProfile**: One-to-one with User
  - Academic: program, enrollment_number, current_cgpa, graduation_cgpa, active_backlogs
  - Personal: date_of_birth, gender, profile_picture (Cloudinary)
  - Address: address_line1, address_line2, postal_code, city
  - Academic History: tenth_percentage, twelfth_percentage, joining_year
  - Status: is_placed, is_verified
  - Constraint: Verified students must have required academic data

#### Key Files
- **`models.py`**: StudentProfile with Cloudinary image field
- **`serializers.py`**:
  - `StudentRegistrationSerializer`: Admin student registration (creates User + StudentProfile + assigns Student role)
  - `StudentProfileSerializer`: Profile view/update
  - `StudentDetailSerializer`: Admin detailed view
  - `StudentPlacementSerializer`: Placement status update
- **`views.py`**:
  - `StudentRegistrationView`: POST `/api/v1/students/register/` - Admin only
  - `StudentProfileView`: GET/PATCH `/api/v1/students/me/` - Student self-service
  - `StudentViewSet`: Admin student management (list, retrieve, update)
  - `MarkAsPlacedView`: PATCH `/api/v1/students/profiles/{user_id}/mark_as_placed/` - Admin only

#### Business Logic
- Student registration automatically assigns "Student" role
- Profile verification constraint ensures data completeness
- Students can only view/edit their own profile (IsOwnerOrReadOnly)
- Admin/Placement team can view all students
- Search/filter by program, placement status, name, email, enrollment number

---

### 4. Companies App (`apps/companies/`)

#### Models
- **Company**: Company information
  - Basic: name, email, phone_number, website_url, description
  - Media: logo (Cloudinary)
  - Details: year_founded, company_size (IntegerChoices: Self, 1-10, 11-50, 51-500, 500+)
  - Location: headquarters_address, headquarters_city

#### Key Files
- **`models.py`**: Company model
- **`serializers.py`**: `CompanySerializer` with nested city name
- **`views.py`**: `CompanyViewSet` - Read (authenticated), Write (Admin only)

#### Access Control
- List/Retrieve: Any authenticated user
- Create/Update/Delete: Admin only

---

### 5. Placements App (`apps/placements/`)

#### Models
- **PlacementDrive**: Top-level placement drive (e.g., "2024 Campus Recruitment")
  - Fields: title, start_date, end_date
- **CompanyDrive**: Company-specific drive within a PlacementDrive
  - Fields: placement_drive, company, drive_type (FullTime/Internship/Contract)
  - Fields: job_mode (Onsite/Remote/Hybrid), application_deadline, status (Open/Closed)
  - Fields: rounds (JSON), locations (JSON), multiple_allowed (boolean)
- **Job**: Job posting within a CompanyDrive
  - Eligibility: min_ug_cgpa, min_pg_cgpa, min_tenth_percentage, min_twelfth_percentage, max_active_backlogs
  - Packages: ug_package_min/max, pg_package_min/max, ug_stipend, pg_stipend
  - Content: title, description_ug, description_pg, job_pdf (Cloudinary), job_desc (JSON)
  - Many-to-many: eligible_programs (via JobProgram)
- **JobProgram**: Through model for Job-Program relationship

#### Key Files
- **`models.py`**: PlacementDrive, CompanyDrive, Job, JobProgram
- **`serializers.py`**:
  - `PlacementDriveSerializer`: Drive management
  - `CompanyDriveReadSerializer`: Read with nested company and drive info
  - `CompanyDriveWriteSerializer`: Write with nested jobs creation
  - `JobReadSerializer`: Read with eligible programs
  - `JobWriteSerializer`: Write with program eligibility
- **`views.py`**:
  - `PlacementDriveViewSet`: Admin only, full CRUD
  - `CompanyDriveViewSet`: Read (authenticated), Write (Admin), custom action `jobs/`
  - `JobViewSet`: Read (authenticated), Write (Admin)
- **`utils.py`**: `send_drive_notification()` - Email notifications to eligible students

#### Business Logic
- Students only see "Open" drives
- Job eligibility based on program, CGPA, percentages, backlogs
- Drive notifications sent to final-year students matching program eligibility
- Multiple jobs allowed per drive (controlled by `multiple_allowed` flag)

---

### 6. Applications App (`apps/applications/`)

#### Models
- **CompanyDriveApplication**: Student application to a company drive
  - Fields: company_drive, student, status (Applied/Withdrawn/Offered/Rejected/Accepted/Declined)
  - Fields: offered_job, resume (string), applied_at, updated_at
  - Unique constraint: (company_drive, student)
- **JobPreference**: Job preferences within an application
  - Fields: drive_application, job, preference_order
  - Unique constraints: (drive_application, job), (drive_application, preference_order)

#### Key Files
- **`models.py`**: CompanyDriveApplication, JobPreference
- **`serializers.py`**:
  - `CompanyDriveApplicationBaseSerializer`: Base with common validations
  - `CompanyDriveApplicationCreateSerializer`: Create with job preferences and eligibility checks
  - `CompanyDriveApplicationDetailSerializer`: Read with job preferences
  - `JobPreferenceSerializer`: Job preference management
- **`views.py`**: `CompanyDriveApplicationViewSet` with custom actions:
  - `create`: Student creates application (validates eligibility, drive status, duplicates)
  - `withdraw`: POST `/api/v1/applications/{id}/withdraw/` - Student only
  - `accept_offer`: POST `/api/v1/applications/{id}/accept_offer/` - Student only, sends email
  - `decline_offer`: POST `/api/v1/applications/{id}/decline_offer/` - Student only
  - `offer_job`: POST `/api/v1/applications/{id}/offer_job/` - Admin/Placement, sends email
  - `reject`: POST `/api/v1/applications/{id}/reject/` - Admin/Placement

#### Business Logic
- **Eligibility Validation**:
  - Student must be verified
  - Program must be in job's eligible_programs
  - CGPA check (UG vs PG)
  - 10th/12th percentage checks
  - Active backlogs check
- **Application Rules**:
  - Drive must be "Open"
  - Application deadline not passed
  - No duplicate applications
  - Multiple jobs allowed only if `multiple_allowed=True`
- **Status Transitions**:
  - Applied → Withdrawn (student)
  - Applied → Offered (admin/placement)
  - Applied → Rejected (admin/placement)
  - Offered → Accepted (student)
  - Offered → Declined (student)
- **Email Notifications**:
  - Job offer emails sent when admin offers job
  - Offer acceptance emails sent when student accepts

---

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

---

## API Endpoints Summary

### Authentication (`/api/v1/`)
- `POST /token/` - Login
- `POST /token/refresh/` - Refresh token
- `POST /auth/select-role/` - Select role for multi-role users
- `POST /logout/` - Logout

### Users (`/api/v1/users/`)
- `POST /register/` - Admin user registration
- `GET /me/` - Current user profile
- `PATCH /me/` - Update current user profile
- `GET /manage/` - List users (Admin)
- `GET /manage/{id}/` - User details (Admin)
- `PATCH /manage/{id}/roles/` - Update user roles (Admin)
- `PATCH /manage/{id}/activation/` - Activate/deactivate user (Admin)
- `DELETE /manage/{id}/` - Delete user (Admin)

### Students (`/api/v1/students/`)
- `POST /register/` - Admin student registration
- `GET /me/` - Current student profile
- `PATCH /me/` - Update student profile
- `GET /profiles/` - List students (Admin/Placement)
- `GET /profiles/{user_id}/` - Student details (Admin/Placement)
- `PATCH /profiles/{user_id}/` - Update student (Admin)
- `PATCH /profiles/{user_id}/mark_as_placed/` - Mark as placed (Admin)

### Companies (`/api/v1/companies/`)
- `GET /` - List companies (authenticated)
- `GET /{id}/` - Company details (authenticated)
- `POST /` - Create company (Admin)
- `PATCH /{id}/` - Update company (Admin)
- `DELETE /{id}/` - Delete company (Admin)

### Placements (`/api/v1/placements/`)
- `GET /placement-drives/` - List drives (Admin)
- `POST /placement-drives/` - Create drive (Admin)
- `GET /company-drives/` - List company drives (authenticated, students see only Open)
- `POST /company-drives/` - Create company drive with jobs (Admin)
- `GET /company-drives/{id}/jobs/` - Get jobs for drive (authenticated)
- `GET /jobs/` - List jobs (authenticated, students see only Open drives)
- `POST /jobs/` - Create job (Admin)

### Applications (`/api/v1/applications/`)
- `GET /` - List applications (students see own, admin/placement see all)
- `POST /` - Create application (Student, validates eligibility)
- `GET /{id}/` - Application details
- `POST /{id}/withdraw/` - Withdraw application (Student)
- `POST /{id}/accept_offer/` - Accept job offer (Student)
- `POST /{id}/decline_offer/` - Decline job offer (Student)
- `POST /{id}/offer_job/` - Offer job to student (Admin/Placement)
- `POST /{id}/reject/` - Reject application (Admin/Placement)

### Core (`/api/v1/core/`)
- `GET /lookup/?type=countries|states|cities|degrees|programs` - Lookup data

### Password Reset (`/api/v1/password-reset/`)
- Uses `django_rest_passwordreset` library
- Signal handler sends emails via background task

---

## Business Logic Highlights

### Student Registration
1. Admin creates user with email, phone, name
2. System generates random password
3. User created with "Student" role assigned
4. StudentProfile created with enrollment number and program
5. Welcome email sent with credentials

### Application Process
1. Student applies to company drive with job preferences
2. System validates:
   - Student is verified
   - Drive is Open and deadline not passed
   - No duplicate application
   - Job eligibility (program, CGPA, percentages, backlogs)
   - Multiple jobs allowed if applicable
3. Application created with status "Applied"
4. Admin/Placement reviews and can:
   - Offer job → Status "Offered", email sent
   - Reject → Status "Rejected"
5. Student can:
   - Accept offer → Status "Accepted", email sent
   - Decline offer → Status "Declined"
   - Withdraw (if Applied) → Status "Withdrawn"

### Drive Notifications
- When job is added to drive, system calculates eligible students
- Filters by:
  - Program eligibility
  - Final year (current_year - (duration - 1))
  - Not placed
  - Active user
- Sends email notification to all eligible students

### Role Management
- Users can have multiple roles
- Login requires role selection if multiple roles exist
- JWT contains `active_role` claim
- Permissions check both token claim and database role

---

## Testing Strategy

### Test Pyramid Structure
```
      /\        Few E2E Tests
     /  \       
    /----\      More Integration Tests
   /------\     
  /--------\    Many Unit Tests
```

### Unit Tests (Many)
**Target**: Individual components in isolation

#### Core App
- Models: Country, State, City, Degree, Program (CRUD, relationships)
- Serializers: All serializers (validation, transformation)
- Permissions: IsAdminRole, IsStudentRole, IsPlacementTeam, IsOwnerOrReadOnly
- Response Classes: All response types (SuccessResponse, ErrorResponse, etc.)
- Pagination: StandardPagination (page size, metadata)
- Exception Handler: All exception types
- Middleware: SecurityHeadersMiddleware
- Utils: Email sending, cookie settings
- Tasks: Background email tasks

#### Users App
- Models: User, Role (CRUD, relationships, password generation)
- Authentication: CookieJWTAuthentication (token extraction, validation)
- Serializers: All serializers (validation, sanitization, role assignment)
- Views: LoginView, LoginRoleView, MyTokenRefreshView, LogoutView, CurrentUserView, UserRegistrationView, UserViewSet
- Signals: Password reset email handler

#### Students App
- Models: StudentProfile (CRUD, constraints, relationships)
- Serializers: All serializers (validation, nested data)
- Views: StudentRegistrationView, StudentProfileView, StudentViewSet, MarkAsPlacedView

#### Companies App
- Models: Company (CRUD, relationships)
- Serializers: CompanySerializer
- Views: CompanyViewSet

#### Placements App
- Models: PlacementDrive, CompanyDrive, Job, JobProgram (CRUD, relationships)
- Serializers: All serializers (nested creation, validation)
- Views: PlacementDriveViewSet, CompanyDriveViewSet, JobViewSet
- Utils: send_drive_notification (eligibility calculation, email sending)

#### Applications App
- Models: CompanyDriveApplication, JobPreference (CRUD, constraints, relationships)
- Serializers: All serializers (eligibility validation, job preference validation)
- Views: CompanyDriveApplicationViewSet (all actions: create, withdraw, accept_offer, decline_offer, offer_job, reject)

### Integration Tests (More)
**Target**: Component interactions

#### Authentication Flow
- Login with single role → JWT issued
- Login with multiple roles → Role selection required
- Role selection → JWT issued with selected role
- Token refresh → New tokens issued
- Logout → Token blacklisted, cookies cleared
- Invalid token → Authentication fails
- Expired token → Refresh required

#### User Management Flow
- Admin creates user → User created, roles assigned, email sent
- Admin updates roles → Roles updated, permissions checked
- User updates profile → Profile updated (owner check)
- Admin deactivates user → User cannot login

#### Student Registration Flow
- Admin registers student → User + StudentProfile created, Student role assigned, email sent
- Student updates profile → Profile updated (owner check)
- Admin marks as placed → is_placed updated

#### Application Flow
- Student applies to drive → Eligibility validated, application created
- Student applies duplicate → Validation error
- Student applies to closed drive → Validation error
- Student applies after deadline → Validation error
- Admin offers job → Status updated, email sent
- Student accepts offer → Status updated, email sent
- Student withdraws application → Status updated

#### Drive Management Flow
- Admin creates drive with jobs → Drive + Jobs created, notifications sent
- Student views drives → Only Open drives visible
- Admin adds job to drive → Notifications sent to eligible students

#### Permission Flow
- Admin accesses admin endpoint → Allowed
- Student accesses admin endpoint → Forbidden
- Student accesses own profile → Allowed
- Student accesses other profile → Read allowed, Write forbidden
- Placement team accesses student list → Allowed

### E2E Tests (Few)
**Target**: Complete user workflows

#### Student Journey
1. Admin registers student
2. Student logs in
3. Student updates profile
4. Student views available drives
5. Student applies to drive
6. Admin offers job
7. Student accepts offer

#### Admin Journey
1. Admin logs in
2. Admin creates placement drive
3. Admin creates company drive with jobs
4. Admin views applications
5. Admin offers jobs to students
6. Admin marks students as placed

#### Multi-Role User Journey
1. User with multiple roles logs in
2. User selects role
3. User performs actions as selected role
4. User switches role (new login)
5. User performs actions as new role

---

## Key Testing Considerations

### Test Data Setup
- Use factories (factory-boy) for model creation
- Use fixtures for lookup data (countries, states, programs)
- Use test database (SQLite in-memory for speed)

### Authentication Testing
- Mock JWT tokens for unit tests
- Use test client with cookies for integration tests
- Test token expiration and refresh

### Permission Testing
- Test all permission classes with different roles
- Test object-level permissions (IsOwnerOrReadOnly)
- Test admin override in permissions

### Email Testing
- Use locmem email backend in tests
- Verify email content and recipients
- Test background email tasks

### File Upload Testing
- Mock Cloudinary for tests
- Test file validation and storage

### Transaction Testing
- Test atomic transactions (student registration, application creation)
- Test rollback on errors

### Edge Cases
- Duplicate applications
- Expired deadlines
- Invalid eligibility
- Missing required fields
- Invalid role assignments
- Token tampering attempts

---

## Current Test Status

### Existing Tests
- `apps/core/tests/`: Comprehensive test suite
- `apps/users/tests/`: User and authentication tests
- `apps/applications/tests/`: Application tests

### Missing Tests
- `apps/students/tests.py`: Needs to be migrated to `tests/` directory
- `apps/companies/tests.py`: Needs comprehensive tests
- `apps/placements/tests.py`: Needs comprehensive tests

### Test Infrastructure
- `run_tests.sh`: Test runner script
- `pytest` + `pytest-django`: Test framework
- `factory-boy`: Test data generation
- `coverage`: Code coverage tracking

---

## Next Steps for Testing

1. **Complete Unit Tests**
   - Finish all model tests
   - Complete all serializer tests
   - Complete all view tests
   - Complete all permission tests

2. **Add Integration Tests**
   - Authentication flows
   - User management flows
   - Student registration flows
   - Application flows
   - Drive management flows

3. **Add E2E Tests**
   - Student journey
   - Admin journey
   - Multi-role user journey

4. **Test Coverage**
   - Aim for 80%+ coverage
   - Focus on business logic
   - Test edge cases

5. **CI/CD Integration**
   - Run tests on every commit
   - Generate coverage reports
   - Block merges on test failures

---

## Summary

The Placemate backend is a well-structured Django REST API with:
- **6 main apps**: core, users, students, companies, placements, applications
- **Cookie-based JWT authentication** with role-based access control
- **Standardized API responses** and error handling
- **Complex business logic** for placement management
- **Email notifications** for key events
- **File uploads** via Cloudinary
- **Comprehensive permission system**

The codebase follows Django best practices with:
- Custom user model
- Reusable base classes (BaseViewSet)
- Centralized utilities
- Background task processing
- Security best practices

Ready for comprehensive testing implementation!