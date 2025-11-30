# PLACEMATE - USERS APP TEST REPORT

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Test Suite** | Users Application (Auth, Profiles, Admin) |
| **Total Tests** | 75 |
| **Status** | ALL TESTS PASSED |
| **Execution Time** | 95.132 seconds |
| **Test Database** | `test_postgres` (keepdb) |
| **Coverage** | Models, Serializers, Views, Permissions, Auth |

---

## TEST EXECUTION DETAILS

### 1. AUTHENTICATION FLOWS (`apps/users/tests/test_auth.py`)

| Test ID | Test Class | Focus | Status | Priority |
|---------|------------|-------|--------|----------|
| USERS-AUTH-001-001-001 → 005 | `AuthenticationTest` | Login success/error, role selection prompts, inactive users | PASS | Critical |
| USERS-AUTH-001-002-001 → 003 | `TokenManagementTest` | Token refresh, logout, cookie handling | PASS | High |
| USERS-AUTH-001-003-001 → 003 | `RoleSelectionTest` | Role selection happy path + validation errors | PASS | High |

### 2. PERMISSION & SECURITY TESTS (`apps/users/tests/test_permissions.py`)

| Test ID | Test Class | Focus | Status | Priority |
|---------|------------|-------|--------|----------|
| USERS-PERMISSIONS-001-001-* | `RoleBasedPermissionsTest` | `IsAdminRole`, `IsPlacementTeam`, `IsStudentRole` | PASS | High |
| USERS-PERMISSIONS-001-002-* | `SecurityValidationTest` | Self-modification safeguards, admin actions | PASS | High |
| USERS-PERMISSIONS-001-003-* | `AuthenticationRequiredTest` | Protected endpoints vs unauthenticated requests | PASS | Medium |

### 3. VIEW TESTS (`apps/users/tests/test_views.py`)

| Test ID | Test Class | Focus | Status | Priority |
|---------|------------|-------|--------|----------|
| USERS-VIEWS-001-001-* | `AdminUserManagementTest` | `/api/v1/users/manage/` CRUD, roles, activation | PASS | Critical |
| USERS-VIEWS-001-002-* | `ProfileManagementTest` | `/api/v1/users/me/` retrieval & patch validation | PASS | High |
| USERS-VIEWS-001-003-* | `UserFilteringTest` | Role / activity filters, pagination data | PASS | Medium |

### 4. SERIALIZER TESTS (`apps/users/tests/test_serializers.py`)

| Serializer Suite | Coverage Highlights | Status |
|------------------|---------------------|--------|
| `UserRegistrationSerializerTest` | Unique email/phone, role validation, random password dispatch | PASS |
| `LoginUserSerializerTest` | Disabled accounts, invalid credentials, normalization | PASS |
| `SelectRoleSerializerTest` | Active role validation, inactive users | PASS |
| `UserSerializer`, `UserRoleUpdateSerializer`, `UserDetailSerializer` | Field-level validation, read-only enforcement | PASS |

### 5. MODEL TESTS (`apps/users/tests/test_models.py`)

| Focus | Status |
|-------|--------|
| `User` creation helpers, hashing, timestamps | PASS |
| `Role` uniqueness, relationships | PASS |

---

## TEST QUALITY HIGHLIGHTS

- **Cookie-based JWT simulation** with `RefreshToken` mirrors real clients (no `force_authenticate` usage).
- **Standardized responses** asserted via `ValidationErrorResponse`, `SuccessResponse`, `ForbiddenResponse`.
- **Test Case IDs** embedded for every method to aid traceability with QA.
- **Mocks**: External email dispatch patched via `apps.applications.views.send_email_in_background` & `apps.users.serializers.send_email_in_background`.
- **Negative paths**: invalid login, inactive accounts, duplicate registrations, unauthorized admin actions.

---

## COMMAND TO REPRODUCE

```bash
cd backend
source venv/bin/activate
./run_tests.sh apps.users
```

---

## CHANGE HISTORY

- **Last Run**: `./run_tests.sh apps.users` (all 75 tests green)
- **Environment**: macOS 15 / Python 3.13 / Django 5.2.6 / PostgreSQL (Docker)  
- **Notes**: Uses `--keepdb` for <1 min execution; drop DB if schema changes.

---

**Status**: Users app test suite documented and passing.  
**Owner**: QA & Backend Team  
**Next Review**: Before release candidate freeze.


