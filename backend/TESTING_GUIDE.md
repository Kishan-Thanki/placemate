# Placemate Backend - Testing Guide

## 🧪 Quick Start

### Run All Tests
```bash
cd backend
./run_tests.sh --all
```

### Run Specific App Tests
```bash
# Core app only
./run_tests.sh --core

# Multiple apps
./run_tests.sh --core --users --students

# Specific app by name
python manage.py test apps.students
```

### Run with Coverage
```bash
coverage run --source='.' manage.py test
coverage report
coverage html  # Generates HTML report in htmlcov/
```

## 📊 Test Structure

### Unit Tests (Many)
Located in: `apps/{app_name}/tests/`

**Test Files:**
- `test_models.py` - Model validation, constraints, relationships
- `test_serializers.py` - Serializer validation, data transformation
- `test_views.py` - View permissions, CRUD operations
- `test_utils.py` - Utility functions (where applicable)

**Apps with Complete Unit Tests:**
- ✅ `apps.core` - 10+ test files
- ✅ `apps.users` - 5 test files
- ✅ `apps.students` - 3 test files (23 test cases)
- ✅ `apps.companies` - 2 test files (13 test cases)
- ✅ `apps.placements` - 4 test files (22 test cases)
- ✅ `apps.applications` - 4 test files (34 test cases)

### Integration Tests (More)
Located in: `tests/integration/`

**Test Files:**
- `test_auth_flows.py` - Complete authentication workflows
- `test_application_workflow.py` - Application lifecycle
- `test_drive_management.py` - Drive creation and management

**Run Integration Tests:**
```bash
python manage.py test tests.integration
```

### E2E Tests (Few)
Located in: `tests/e2e/`

**Test Files:**
- `test_student_journey.py` - Complete student lifecycle
- `test_admin_journey.py` - Complete admin workflow

**Run E2E Tests:**
```bash
python manage.py test tests.e2e
```

## 🎯 Test Categories

### 1. Model Tests
Test model creation, validation, constraints, and relationships.

**Example:**
```python
def test_student_profile_creation(self):
    profile = StudentProfile.objects.create(
        user=self.user,
        program=self.program,
        enrollment_number='EN2024001',
        joining_year=2024
    )
    self.assertEqual(profile.enrollment_number, 'EN2024001')
```

### 2. Serializer Tests
Test data validation, transformation, and business logic.

**Example:**
```python
def test_student_registration_serializer_valid_data(self):
    serializer = StudentRegistrationSerializer(data=data)
    self.assertTrue(serializer.is_valid())
    profile = serializer.save()
    self.assertEqual(profile.enrollment_number, 'EN2024001')
```

### 3. View Tests
Test API endpoints, permissions, and responses.

**Example:**
```python
def test_list_students_as_admin(self):
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data['data']), 2)
```

### 4. Integration Tests
Test complete workflows involving multiple components.

**Example:**
```python
def test_complete_application_workflow(self):
    # Student applies
    apply_response = self.client.post(apply_url, apply_data)
    # Admin offers job
    offer_response = self.client.post(offer_url, offer_data)
    # Student accepts
    accept_response = self.client.post(accept_url)
```

### 5. E2E Tests
Test complete user journeys from start to finish.

**Example:**
```python
def test_complete_student_journey(self):
    # 1. Admin registers student
    # 2. Student logs in
    # 3. Student updates profile
    # 4. Student applies to drive
    # 5. Admin offers job
    # 6. Student accepts offer
    # 7. Admin marks as placed
```

## 🔧 Test Utilities

### Authentication Helpers
```python
def _authenticate_admin(self):
    refresh = RefreshToken.for_user(self.admin_user)
    refresh['active_role'] = 'Admin'
    self.client.cookies['access_token'] = str(refresh.access_token)
```

### Mocking External Services
```python
@patch('apps.core.tasks.send_email_in_background')
def test_email_sent(self, mock_email):
    # Test code
    mock_email.assert_called_once()
```

## 📝 Test Naming Convention

All tests follow this structure:
- **Test Suite ID**: `{APP}-{TYPE}-{NUMBER}`
- **Test Case ID**: `{APP}-{TYPE}-{NUMBER}-{SUITE}-{CASE}`
- **Docstrings**: Include Test Case ID, module, test type, priority, objective

**Example:**
```python
def test_student_profile_creation(self):
    """
    Test Case ID: STUDENTS-MODEL-001-001-001
    Module: Students App - StudentProfile Model
    Test Type: Unit Test
    Priority: High
    
    Objective: Verify StudentProfile can be created with valid data
    """
```

## ✅ Test Checklist

Before committing tests, ensure:
- [ ] All tests have Test Case IDs
- [ ] Tests include comprehensive docstrings
- [ ] setUp/tearDown methods properly configured
- [ ] Tests are isolated and independent
- [ ] Both success and failure scenarios tested
- [ ] Edge cases covered
- [ ] External dependencies mocked
- [ ] All tests pass consistently

## 🐛 Debugging Tests

### Run Single Test
```bash
python manage.py test apps.students.tests.test_models.StudentProfileModelTest.test_student_profile_creation
```

### Run with Verbose Output
```bash
python manage.py test apps.students --verbosity=2
```

### Run with Debugger
```bash
python -m pdb manage.py test apps.students
```

### Check Test Database
```bash
python manage.py test --keepdb  # Reuse test database
```

## 📈 Coverage Goals

- **Overall Coverage**: Target 80%+
- **Critical Paths**: Target 95%+
- **Models**: 100%
- **Serializers**: 100%
- **Views**: 100%
- **Utils**: 100%

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          ./run_tests.sh --all
```

## 📚 Additional Resources

- **Test Progress**: See `TEST_SUITE_PROGRESS.md`
- **Backend Architecture**: See `BACKEND_UNDERSTANDING.md`
- **Django Testing**: https://docs.djangoproject.com/en/stable/topics/testing/
- **DRF Testing**: https://www.django-rest-framework.org/api-guide/testing/

## 🎉 Test Statistics

- **Total Test Files**: 30+
- **Total Test Cases**: 200+
- **Unit Tests**: 200+ test cases
- **Integration Tests**: 15+ test cases
- **E2E Tests**: 2 comprehensive journeys

---

**Happy Testing! 🧪**

