# PLACEMATE - PLACEMENTS APP TEST REPORT

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Test Suite** | Placements (Drives, Company Drives, Jobs, Notifications) |
| **Total Tests** | 31 |
| **Status** | ALL TESTS PASSED |
| **Execution Time** | 42.484 seconds |
| **Test Database** | `test_postgres` (`--keepdb`) |
| **Coverage** | Models, Serializers, ViewSets, Utility Notifications |

---

## TEST EXECUTION DETAILS

### 1. MODEL TESTS (`apps/placements/tests/test_models.py`)

| Entities | Coverage | Status |
|----------|----------|--------|
| `PlacementDrive`, `CompanyDrive` | Creation, defaults, relationships | PASS |
| `Job`, `JobProgram` | Eligibility metadata, representation | PASS |

### 2. SERIALIZER TESTS (`apps/placements/tests/test_serializers.py`)

| Serializer | Focus | Status |
|------------|-------|--------|
| `CompanyDriveReadSerializer`, `WriteSerializer` | Nested jobs, required job list, notification patching | PASS |
| `JobReadSerializer`, `JobWriteSerializer` | Annotated fields (`company_name`, `drive_title`), eligible programs persistence | PASS |

### 3. VIEW TESTS (`apps/placements/tests/test_views.py`)

| Test Class | Highlights | Status |
|------------|------------|--------|
| `PlacementDriveViewSetTest` | Admin-only CRUD via cookie JWT | PASS |
| `CompanyDriveViewSetTest` | Student vs admin visibility, drive creation, `/jobs/` action | PASS |
| `JobViewSetTest` | Student listing, admin creation (notification mocked) | PASS |

The helper `create_verified_profile()` now uses `update_or_create` to prevent `user_id` collisions when `--keepdb` is active.

### 4. UTILITY TESTS (`apps/placements/tests/test_utils.py`)

| Test Case IDs | Focus | Change | Status |
|---------------|-------|--------|--------|
| PLACEMENTS-UTILS-001-001-001 → 005 | `send_drive_notification` final-year targeting, exclusion rules, email context | Patched `apps.placements.utils.send_email_in_background`, fixtures include CGPA/percentages for DB constraint | PASS |

---

## QUALITY NOTES

- Tests rely on **cookie-based JWT** via `RefreshToken` to mimic production middleware.
- All email dispatches patched at module under test (`apps.placements.utils`) to avoid cross-module patch issues.
- Student fixtures populate `current_cgpa`, `tenth_percentage`, `twelfth_percentage`, satisfying `verified_student_has_required_data`.
- Drive creation tests assert `application_deadline` presence to satisfy notification logic.

---

## COMMAND TO REPRODUCE

```bash
cd backend
source venv/bin/activate
./run_tests.sh apps.placements
```

---

**Status**: Placements suite healthy and documented.  
**Owner**: Backend + QA.  
**Next Review**: Prior to release branch cut.


