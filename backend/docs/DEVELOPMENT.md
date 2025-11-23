# Development Guide

Complete guide for contributing to Placemate Backend.

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL (or Supabase)
- Git
- Docker (optional, for containerized development)

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/Kishan-Thanki/placemate.git
cd placemate/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env .env
# Edit .env with your local settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## Code Style

### Python Style Guide

- Follow PEP 8
- Use Black for formatting (if configured)
- Maximum line length: 100 characters
- Use type hints where appropriate

### Django Best Practices

- Use Django's built-in features (e.g., `get_object_or_404`)
- Follow Django naming conventions
- Use `select_related()` and `prefetch_related()` for database queries
- Use transactions for atomic operations

### Code Organization

- Keep views thin, business logic in serializers or utils
- Use serializers for validation and data transformation
- Centralize common functionality in `apps/core/`
- Follow DRY (Don't Repeat Yourself) principle

## Testing

### Running Tests

```bash
# Run all tests
./run_tests.sh --all

# Run specific app tests
./run_tests.sh --core
./run_tests.sh --users
./run_tests.sh --students
./run_tests.sh --companies
./run_tests.sh --placements
./run_tests.sh --applications

# Run with pytest directly
pytest
pytest apps/core/tests/
pytest apps/users/tests/test_auth.py

# Run with coverage
pytest --cov=apps --cov-report=html
```

### Test Structure

```
apps/
  core/
    tests/
      test_models.py
      test_serializers.py
      test_views.py
      test_permissions.py
      ...
  users/
    tests/
      test_models.py
      test_auth.py
      ...
tests/
  integration/
    test_auth_flows.py
    test_application_workflow.py
    ...
  e2e/
    test_student_journey.py
    test_admin_journey.py
    ...
```

### Writing Tests

#### Unit Tests

Test individual components in isolation:

```python
from django.test import TestCase
from apps.core.models import Country

class CountryModelTest(TestCase):
    def test_country_creation(self):
        country = Country.objects.create(name="India")
        self.assertEqual(country.name, "India")
        self.assertEqual(str(country), "India")
```

#### Integration Tests

Test component interactions:

```python
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

class AuthenticationFlowTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email="test@example.com",
            phone_number="1234567890",
            password="testpass123"
        )
    
    def test_login_flow(self):
        response = self.client.post('/api/v1/token/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.cookies)
```

#### E2E Tests

Test complete workflows:

```python
class StudentJourneyTest(TestCase):
    def test_complete_student_application_flow(self):
        # 1. Admin registers student
        # 2. Student logs in
        # 3. Student views drives
        # 4. Student applies to drive
        # 5. Admin offers job
        # 6. Student accepts offer
        pass
```

### Test Data

Use factories for test data:

```python
from factory import DjangoModelFactory
from apps.users.models import User

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    phone_number = factory.Sequence(lambda n: f"123456789{n}")
```

### Test Coverage

Aim for 80%+ code coverage. Focus on:
- Business logic
- Edge cases
- Error handling
- Permission checks

## Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `dev`: Development branch
- `feature/feature-name`: Feature branches
- `fix/bug-name`: Bug fix branches

### Commit Messages

Follow conventional commits:

```
feat: Add student registration endpoint
fix: Fix authentication token refresh
docs: Update API documentation
test: Add tests for application workflow
refactor: Simplify permission checking
```

### Pull Request Process

1. Create feature branch from `dev`
2. Make changes and add tests
3. Ensure all tests pass
4. Update documentation if needed
5. Create pull request to `dev`
6. Request code review
7. Address review comments
8. Merge after approval

## Adding New Features

### Step-by-Step Process

1. **Create Feature Branch**
   ```bash
   git checkout -b username/new-feature
   ```

2. **Create Models** (if needed)
   - Add model in appropriate app
   - Create and run migrations
   - Add to admin if needed

3. **Create Serializers**
   - Input validation
   - Data transformation
   - Nested serializers if needed

4. **Create Views**
   - Use BaseViewSet for CRUD
   - Add custom actions if needed
   - Set appropriate permissions

5. **Add URL Routes**
   - Add to app's `urls.py`
   - Include in `apps/api/v1/urls.py`

6. **Write Tests**
   - Unit tests for models/serializers
   - Integration tests for views
   - E2E tests for workflows

7. **Update Documentation**
   - Update API.md with new endpoints
   - Update ARCHITECTURE.md if needed

8. **Test Locally**
   ```bash
   ./run_tests.sh --all
   python manage.py runserver
   ```

9. **Create Pull Request**

## Debugging

### Django Debug Toolbar

For local development, add Django Debug Toolbar:

```python
# settings/local.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

### Logging

Use Django's logging framework:

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
```

### Database Queries

Enable query logging:

```python
# settings/local.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}
```

## Performance Testing

### Using Locust

```bash
# Start server
python manage.py runserver

# Run Locust (in another terminal)
locust -f locustfile.py --host=http://localhost:8000
```

### Performance Considerations

- Use `select_related()` for foreign keys
- Use `prefetch_related()` for many-to-many
- Avoid N+1 queries
- Use database indexes
- Cache expensive operations

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Logging added where appropriate

## Common Tasks

### Creating Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Superuser

```bash
python manage.py createsuperuser
```

### Collecting Static Files

```bash
python manage.py collectstatic
```

### Running Management Commands

```bash
python manage.py shell
python manage.py dbshell
python manage.py check
```

### Database Backup

```bash
python manage.py dumpdata > backup.json
```

### Database Restore

```bash
python manage.py loaddata backup.json
```

## Troubleshooting

### Import Errors

- Ensure virtual environment is activated
- Check `PYTHONPATH` is set correctly
- Verify all dependencies are installed

### Database Errors

- Check database connection settings
- Verify migrations are up to date
- Check database permissions

### Test Failures

- Clear test database: `python manage.py flush`
- Check test data setup
- Verify fixtures are loaded

### Docker Issues

- Rebuild image: `docker-compose build --no-cache`
- Check logs: `docker-compose logs backend`
- Verify environment variables

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Contributing Guide](../CONTRIBUTING.md)

## Support

For development questions:
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Architecture Documentation](ARCHITECTURE.md)
- Create a GitHub issue
- Contact development team
