# PLACEMATE - APPLICATIONS APP TEST REPORT

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Test Suite** | Applications (Student Applications & Workflow) |
| **Total Tests** | 41 |
| **Status** | ✅ ALL TESTS PASSED |
| **Execution Time** | 76.397 seconds |
| **Test Database** | `test_postgres` (persisted via `--keepdb`) |
| **Coverage** | Models, Serializers, ViewSets, URLs |

---

## TEST EXECUTION DETAILS

### 1. MODEL TESTS (`apps/applications/tests/test_models.py`)

| Test Case IDs | Class | Coverage | Status |
|---------------|-------|----------|--------|
| APPLICATIONS-MODEL-001-001-* | `CompanyDriveApplicationModelTest` | Creation, unique constraints, status transitions, ordering | ✅ PASS |
| APPLICATIONS-MODEL-001-002-* | `JobPreferenceModelTest` | Preference uniqueness, ordering, string repr | ✅ PASS |

### 2. SERIALIZER TESTS (`apps/applications/tests/test_serializers.py`)

| Test Case IDs | Class | Coverage | Status |
|---------------|-------|----------|--------|
| APPLICATIONS-SERIALIZER-001-001-* | `JobPreferenceSerializerTest` | Read-only fields, validation, defaults | ✅ PASS |
| APPLICATIONS-SERIALIZER-001-002-* | `CompanyDriveApplicationBaseSerializerTest` | Student context, duplicate prevention, derived fields | ✅ PASS |
| APPLICATIONS-SERIALIZER-001-003-* | `CompanyDriveApplicationCreateSerializerTest` | Verified profile enforcement, eligibility, multiple job support | ✅ PASS |
| APPLICATIONS-SERIALIZER-001-004-* | `CompanyDriveApplicationDetailSerializerTest` | Nested job preferences serialization | ✅ PASS |

### 3. VIEW TESTS (`apps/applications/tests/test_views.py`)

`CompanyDriveApplicationViewSetTest` (APPLICATIONS-VIEW-001-001-001 → 015) covers:

- Student + admin listing filters
- Application creation (cookie JWT auth)
- Withdraw, accept/reject, offer workflows
- Permission enforcement for placement team vs students
- Filtering by status, custom actions returning `SuccessResponse`

All view actions patch `apps.applications.views.send_email_in_background` to assert notifications without dispatching real emails.

### 4. URL TEST (`apps/applications/tests/test_urls.py`)

Validates `/api/v1/applications/` router registration and detail routes.

---

## QUALITY NOTES

- **Deterministic fixtures**: helper `create_student_profile()` ensures every test respects `verified_student_has_required_data`.
- **JWT Cookie Flow**: every client request loads `access_token` via `RefreshToken` to mirror production cookie auth.
- **ValidationErrorResponse Assertions**: tests assert `422` vs `400` to align with custom exception handler.
- **Ordering Guarantees**: where timestamps are compared, `time.sleep` & secondary ordering (`id`) remove flakiness.

---

## COMMAND TO REPRODUCE

```bash
cd backend
source venv/bin/activate
./run_tests.sh apps.applications
```

---

## STATUS & NEXT STEPS

- **Last Run**: `2025-11-17` – all 41 tests passing.
- **Next Action**: integrate into CI matrix, share this report with QA for acceptance sign-off.


