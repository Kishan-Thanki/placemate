# Placemate Backend – Test Suite Handbook

_Last updated: 2025‑11‑17_


---

## 1. Executive Summary

```
      /\        E2E Tests (2 comprehensive journeys)
     /  \       
    /----\      Integration Tests (15+ workflows)
   /------\     
  /--------\    Unit Tests (200+ test cases)
```

- **Coverage focus**: All six Django apps (Core, Users, Students, Companies, Placements, Applications) plus cross-app flows.
- **Total footprint**: 30+ test files, 200+ unit tests, 15+ integration tests, 2 E2E journeys.
- **Quality goals met**: Deterministic fixtures, docstring test IDs, consistent cookie-based auth, standardized `ValidationErrorResponse (422)` handling.
- **Readiness**: Production-ready, CI/CD friendly, Documented.

---

## 2. Execution Snapshot

### 2.1 App-Level Suites

| App | Command | Total Tests | Status | Notes |
|-----|---------|-------------|--------|-------|
| `apps.core` | `./run_tests.sh apps.core` | 42 | Pass | Permissions, middleware, responses, tasks |
| `apps.users` | `./run_tests.sh apps.users` | 75 | Pass | Auth flows, serializers, admin views |
| `apps.students` | `./run_tests.sh apps.students` | 26 | Pass | Registration, profiles, placement flag |
| `apps.companies` | `./run_tests.sh apps.companies` | 13 | Pass | Company CRUD & validation |
| `apps.placements` | `./run_tests.sh apps.placements` | 31 | Pass | Drives, jobs, notifications |
| `apps.applications` | `./run_tests.sh apps.applications` | 41 | Pass | Application lifecycle & custom actions |

> All commands run inside `backend/venv` with `--keepdb` enabled for faster reruns.

### 2.2 Cross-Module Suites

| Layer | Path | Command | Status |
|-------|------|---------|--------|
| Integration | `tests/integration/` | `python manage.py test tests.integration` | Pass (18 tests) |
| End-to-End | `tests/e2e/` | `python manage.py test tests.e2e` | Pass (2 journeys) |

### 2.3 Documentation Index

| Artifact | Purpose |
|----------|---------|
| `apps/*/*_test.md` | Per-app inventories (core, users, students, companies, placements, applications) |
| `BACKEND_UNDERSTANDING.md` | Architecture overview |
| `TEST_SUITE_HANDBOOK.md` | _This document_ |

### 2.4 Environment & Tooling

- OS: macOS 15 (Apple Silicon)  
- Python: 3.13.5 (`backend/venv`)  
- Django: 5.2.6 + DRF  
- DB: PostgreSQL `test_postgres` (reused via `--keepdb`)  
- Runner: `run_tests.sh` (verbosity 2 + enhanced summaries)

## 3. Progress & Coverage Tracker

### 3.1 Completed Areas

- **Core**: Models, serializers, permissions, responses, pagination, exception handling, middleware, utils, tasks.
- **Users**: Models, serializers, auth & admin views, Cookie JWT auth, role permissions.
- **Students (NEW)**: Profiles + serializers + views; nine model, seven serializer, seven view tests.
- **Companies (NEW)**: Comprehensive model & view coverage.
- **Placements (NEW)**: PlacementDrive/CompanyDrive/Job models, serializers, viewsets, notification utils.
- **Applications**: Models, serializers, views (including custom actions such as withdraw, accept, offer, decline) and URLs.

### 3.2 Integration Workflows

- Auth lifecycle: login (single/multi-role), role selection, refresh, logout, invalid/inactive handling.
- Application workflow: apply, eligibility checks, duplicate prevention, withdraw, offer decline, full acceptance flow.
- Drive management: placement drive creation, company drive creation with jobs + notifications, student/admin visibility, job listings.
- Student registration: admin-driven onboarding + welcome email + verification state.

### 3.3 E2E Journeys

1. **Student Journey** – full lifecycle from registration through placement marking.  
2. **Admin Journey** – placement + company drive setup, application review, offers, placement updates.

### 3.4 Remaining Wishlist

- [ ] Multi-role E2E flow (login → role select → action per role → switch role).  
- [ ] Coverage instrumentation (htmlcov) in CI for visibility metrics.  
- [ ] Optional factories/fixtures for lighter test data authoring.

### 3.5 Statistics & Pyramid

- **Test files**: 30+  
- **Unit cases**: 200+  
- **Integration cases**: 15+  
- **E2E cases**: 2 journeys  
- **Goal**: Maintain ≥80 % coverage overall and ≥95 % on critical endpoints.

---

## 4. Testing Guide & Operations

### 4.1 Quick Commands

```bash
cd backend
./run_tests.sh --all            
./run_tests.sh --core --users    
python manage.py test tests.integration
python manage.py test tests.e2e
```

#### Coverage

```bash
coverage run --source='.' manage.py test
coverage report
coverage html
```

### 4.2 Test Structure

- **Unit tests** live under `apps/<app>/tests/` with `test_models.py`, `test_serializers.py`, `test_views.py`, and app-specific files (permissions, utils, etc.).  
- **Integration tests** live in `tests/integration/` (auth flows, application workflow, drive management).  
- **E2E tests** live in `tests/e2e/` (student/admin journeys).

### 4.3 Naming & Metadata

- Files follow `test_*.py`.  
- Docstrings include `Test Case ID`, module, test type, priority, objective.  
- Example:

```python
def test_student_profile_creation(self):
    """
    Test Case ID: STUDENTS-MODEL-001-001-001
    Module: Students App - StudentProfile Model
    Test Type: Unit Test
    Priority: High
    Objective: Verify StudentProfile creation with valid data.
    """
```

### 4.4 Utilities & Patterns

- **Cookie auth helpers**: use `RefreshToken` to set `access_token` & `refresh_token` cookies; set `active_role` claim before serialization.  
- **External services**: mock with `@patch('apps.core.tasks.send_email_in_background')` or `@patch('apps.placements.serializers.send_drive_notification')`.  
- **Profile creation**: rely on helper functions (`create_verified_profile`) to satisfy DB constraints.

### 4.5 Debugging & Focused Runs

```bash
python manage.py test apps.students.tests.test_models.StudentProfileModelTest.test_student_profile_creation
python manage.py test apps.students --verbosity=2
python -m pdb manage.py test apps.students
python manage.py test --keepdb  
```

### 4.6 Checklist Before Commit

- [x] Test Case IDs + descriptive docstrings  
- [x] Proper `setUp`/`tearDown` isolation  
- [x] Happy-path and failure-path coverage  
- [x] External dependencies mocked  
- [x] Deterministic ordering (explicit `order_by`, `time.sleep` where necessary)  
- [x] `ValidationErrorResponse` expectations updated to HTTP 422


---

## 5. Appendix – File & Suite Index

```
backend/
├── apps/
│   ├── core/tests/                  complete
│   ├── users/tests/                 complete
│   ├── students/tests/              complete
│   ├── companies/tests/             complete
│   ├── placements/tests/            complete
│   └── applications/tests/          complete
├── tests/
│   ├── integration/ (auth, app, drive workflows)
│   └── e2e/ (student, admin journeys)
└── docs & guides
    └── TEST_SUITE_HANDBOOK.md 
```

**Status**: Backend test suite is comprehensive, green, and documented. Use this handbook for ongoing maintenance, onboarding, and QA sign-off.