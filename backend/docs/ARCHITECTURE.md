# Architecture Documentation

Complete system architecture and component documentation for Placemate Backend.

## Technology Stack

- **Framework**: Django 5.2.8 + Django REST Framework 3.16.1
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT (Simple JWT) with HTTP-only cookies
- **File Storage**: Cloudinary (production) / Local filesystem (development)
- **Email**: Brevo (via django-anymail)
- **Deployment**: Docker + Gunicorn + WhiteNoise (Render, Railway, Fly.io, etc.)
- **Testing**: pytest + pytest-django + factory-boy
- **Performance Testing**: Locust

## Key Design Patterns

1. **Cookie-based JWT Authentication** - Secure token storage in HTTP-only cookies
2. **Role-Based Access Control (RBAC)** - Multi-role user system with active role selection
3. **Standardized API Responses** - Consistent JSON structure across all endpoints
4. **Custom Exception Handling** - Centralized error formatting
5. **BaseViewSet Pattern** - Reusable CRUD operations with custom responses
6. **Multi-stage Docker Builds** - Optimized production images

## Project Structure

```
backend/
├── apps/
│   ├── core/           # Core utilities, models, permissions
│   ├── users/           # User management, authentication
│   ├── students/        # Student profiles and management
│   ├── companies/       # Company management
│   ├── placements/      # Placement drives, company drives, jobs
│   └── applications/    # Job applications and preferences
├── placemate/
│   ├── settings/        # Environment-specific settings
│   ├── urls.py          # Root URL configuration
│   ├── wsgi.py          # WSGI application
│   └── asgi.py          # ASGI application
├── templates/           # Email templates
├── static/              # Static files
├── tests/               # Integration and E2E tests
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Local development
├── entrypoint.sh        # Container startup script
└── requirements.txt     # Python dependencies
```

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

## Settings Architecture

### Environment-Specific Settings

- **`base.py`**: Shared configuration (DRF, JWT, CORS, apps, middleware)
- **`local.py`**: Development settings (DEBUG=True, local CORS, local cookies)
- **`production.py`**: Production settings (DEBUG=False, secure cookies, Cloudinary, optimizations)
- **`test.py`**: Test settings (SQLite, fast password hashing, email backend)

### Key Configuration

- **Database**: PostgreSQL via `dj_database_url`
- **Static Files**: WhiteNoise for production
- **Media Files**: Cloudinary in production, local filesystem in development
- **Email**: Brevo via django-anymail
- **CORS**: Configurable via environment variables
- **Security**: HTTPS enforced in production, security headers middleware

## Security Architecture

### Authentication
- JWT tokens in HTTP-only cookies
- Refresh token rotation and blacklisting
- Token expiration: 60 minutes (access), 7 days (refresh)

### Authorization
- Role-based permissions
- Active role stored in JWT claim
- Database verification prevents token tampering
- Object-level permissions (IsOwnerOrReadOnly)

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restricted features

### CORS Configuration
- Credentials allowed
- Configurable allowed origins
- Regex patterns for dynamic subdomains
- CSRF trusted origins match CORS origins

## Data Flow

### Request Flow
1. Request arrives → Middleware (CORS, Security Headers)
2. Authentication → CookieJWTAuthentication extracts token from cookies
3. Authorization → Permission classes check active role
4. View Processing → BaseViewSet handles CRUD operations
5. Serialization → Data validated and transformed
6. Response → Standardized response format
7. Exception Handling → Custom exception handler formats errors

### Email Flow
1. Action triggers email (e.g., job offer)
2. Background task created → `send_email_in_background()`
3. Thread spawns → Email sent asynchronously
4. Template rendered → HTML email generated
5. Brevo API → Email delivered

## Database Schema

### Key Relationships
- User ↔ Role: Many-to-Many
- User ↔ StudentProfile: One-to-One
- Company ↔ CompanyDrive: One-to-Many
- PlacementDrive ↔ CompanyDrive: One-to-Many
- CompanyDrive ↔ Job: One-to-Many
- Job ↔ Program: Many-to-Many (via JobProgram)
- CompanyDrive ↔ CompanyDriveApplication: One-to-Many
- StudentProfile ↔ CompanyDriveApplication: One-to-Many
- CompanyDriveApplication ↔ JobPreference: One-to-Many

## Performance Considerations

### Database
- Select related and prefetch related for nested data
- Database connection pooling (CONN_MAX_AGE)
- Indexed fields for common queries

### Caching
- LocMem cache for production
- Static file caching via WhiteNoise

### Background Tasks
- Email sending in background threads
- Non-blocking API responses

### Gunicorn Configuration
- Worker count: (2 × CPU) + 1
- Timeout: 90-120 seconds
- Preload: Enabled for memory efficiency

## Testing Architecture

### Test Structure
- Unit tests: Individual components
- Integration tests: Component interactions
- E2E tests: Complete workflows

### Test Tools
- pytest + pytest-django
- factory-boy for test data
- coverage for code coverage
- Locust for performance testing

## Deployment Architecture

### Docker
- Multi-stage builds for optimized images
- Non-root user for security
- Entrypoint script for startup tasks
- Health checks for monitoring

### Production Considerations
- Static files collected on startup
- Database migrations run automatically
- Database connection wait logic
- Environment variable configuration

## Future Enhancements

- Celery for advanced background tasks
- Redis for caching and session storage
- WebSocket support for real-time updates
- Advanced search with Elasticsearch
- API versioning strategy
- GraphQL endpoint option
