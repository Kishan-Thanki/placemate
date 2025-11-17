# PLACEMATE - COMPANIES APP TEST REPORT

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Test Suite** | Companies (Company CRUD & Validation) |
| **Total Tests** | 13 |
| **Status** | ✅ ALL TESTS PASSED |
| **Execution Time** | 21.304 seconds |
| **Test Database** | `test_postgres` |

---

## TEST EXECUTION DETAILS

### 1. MODEL TESTS (`apps/companies/tests/test_models.py`)

| Coverage | Status |
|----------|--------|
| Company creation, string representation, field defaults | ✅ |
| Unique constraints (email/phone), contact info validation | ✅ |

### 2. VIEW TESTS (`apps/companies/tests/test_views.py`)

| Test Suite | Endpoints | Status |
|------------|-----------|--------|
| `CompanyViewSetTest` | `/api/v1/companies/` list/create/update/delete | ✅ |

Highlights:
- Admin-only write operations enforced through cookie JWT auth + `IsAdminRole`.
- Student read access validated (SAFE methods).
- Pagination and standardized `SuccessResponse` payloads asserted.

---

## COMMAND TO REPRODUCE

```bash
cd backend
source venv/bin/activate
./run_tests.sh apps.companies
```

---

**Status**: ✅ Companies app verified.  
**Owner**: Backend/QA.  
**Next Steps**: Automatically include this report in tester handoff package.


