# PLACEMATE - STUDENTS APP TEST REPORT

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Test Suite** | Students (Profiles, Registration Serializers, Views) |
| **Total Tests** | 26 |
| **Status** | ✅ ALL TESTS PASSED |
| **Execution Time** | 38.217 seconds |
| **Test Database** | `test_postgres` |

---

## TEST EXECUTION DETAILS

### 1. MODEL TESTS (`apps/students/tests/test_models.py`)

| Test Case IDs | Coverage | Status |
|---------------|----------|--------|
| STUDENTS-MODEL-001-001-* | `StudentProfile` creation, constraints (`verified_student_has_required_data`), ordering | ✅ |
| STUDENTS-MODEL-001-002-* | String representations, verification flags | ✅ |

### 2. SERIALIZER TESTS (`apps/students/tests/test_serializers.py`)

| Serializer | Focus | Status |
|------------|-------|--------|
| `StudentRegistrationSerializer` | Uniqueness, CGPA/phone validation | ✅ |
| `StudentProfileSerializer` | Nested user data, writable fields, CGPA ranges | ✅ |
| `StudentProfileUpdateSerializer` | Partial updates, verification toggles | ✅ |

### 3. VIEW TESTS (`apps/students/tests/test_views.py`)

| Test Class | Endpoints Covered | Status |
|------------|-------------------|--------|
| `StudentRegistrationViewTest` | `/api/v1/students/register/` | ✅ |
| `StudentProfileViewTest` | `/api/v1/students/profile/` GET/PATCH | ✅ |
| `StudentViewSetTest` | Admin listing/filtering, `/mark-as-placed/` action | ✅ |

Cookie-based JWT auth is used via `RefreshToken` for every request, ensuring middleware + permissions behave exactly like production.

---

## QUALITY HIGHLIGHTS

- Fixtures reuse helpers to guarantee deterministic `StudentProfile` data (CGPA, percentages, enrollment numbers).
- Negative cases for duplicate phone, invalid CGPA, double verification are explicitly asserted.
- Placement-team specific actions patched to avoid email dispatch.

---

## COMMAND TO REPRODUCE

```bash
cd backend
source venv/bin/activate
./run_tests.sh apps.students
```

---

**Status**: ✅ Students app test documentation complete.  
**Owner**: Backend/QA.  
**Notes**: Keep fixtures in sync with `students/models.py` when constraints change.


