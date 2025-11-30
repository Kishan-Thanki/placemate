# Troubleshooting Guide

Common issues and solutions for Placemate Backend.

## Table of Contents

- [Docker Issues](#docker-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Environment Variables](#environment-variables)
- [Static Files](#static-files)
- [Email Issues](#email-issues)
- [Performance Issues](#performance-issues)
- [Testing Issues](#testing-issues)

## Docker Issues

### Container Won't Start

**Symptoms:** Container exits immediately or fails to start

**Solutions:**
```bash
# Check logs
docker-compose logs backend

# Check container status
docker ps -a

# Rebuild image
docker-compose build --no-cache

# Check environment variables
docker-compose config
```

**Common Causes:**
- Missing or incorrect `DATABASE_URL`
- Missing required environment variables
- Port already in use
- Permission issues with entrypoint.sh

### Port Already in Use

**Symptoms:** Error: "port is already allocated"

**Solutions:**
```bash
# Change port in docker-compose.yml
ports:
  - "8080:8000"  # Use different port

# Or stop conflicting service
docker-compose down
# Find and stop process using port 8000
```

### Permission Denied on entrypoint.sh

**Symptoms:** Error: "permission denied: ./entrypoint.sh"

**Solutions:**
```bash
# Make script executable
chmod +x entrypoint.sh

# Or rebuild Docker image (chmod is in Dockerfile)
docker-compose build --no-cache
```

### Module Not Found Errors

**Symptoms:** ImportError or ModuleNotFoundError

**Solutions:**
```bash
# Rebuild image
docker-compose build --no-cache

# Check requirements.txt includes all dependencies
pip install -r requirements.txt

# Verify Python path in container
docker-compose exec backend python -c "import sys; print(sys.path)"
```

### High Memory Usage

**Symptoms:** Container uses excessive memory

**Solutions:**
```bash
# Monitor memory usage
docker stats placemate-backend

# Reduce Gunicorn workers in Dockerfile
CMD ["gunicorn", "placemate.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "1", ...]

# Set memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
```

## Database Issues

### Database Connection Failed

**Symptoms:** "could not connect to server" or "connection refused"

**Solutions:**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/database

# Test connection outside Docker
psql $DATABASE_URL

# Check Supabase connection settings
# - Verify host, port, database name
# - Check IP allowlist
# - Verify credentials

# Check network connectivity from container
docker-compose exec backend python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')"
```

### Migration Errors

**Symptoms:** "django.db.utils.OperationalError" during migrations

**Solutions:**
```bash
# Check migration status
python manage.py showmigrations

# Reset migrations (CAUTION: data loss)
python manage.py migrate --fake-initial

# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# For Docker
docker-compose exec backend python manage.py migrate
```

### Database Locked

**Symptoms:** "database is locked" error

**Solutions:**
```bash
# Check for long-running queries
# Kill blocking connections (if safe)
# Restart database connection pool
```

## Authentication Issues

### Token Not Found

**Symptoms:** "Authentication credentials were not provided"

**Solutions:**
- Verify cookies are being sent with requests
- Check CORS configuration allows credentials
- Ensure `CORS_ALLOW_CREDENTIALS = True`
- Verify frontend is sending cookies

### Token Expired

**Symptoms:** "Token is invalid or expired"

**Solutions:**
- Refresh token using `/api/v1/token/refresh/`
- Re-login if refresh token expired
- Check token lifetime settings

### Role Selection Required

**Symptoms:** Login returns "requires_role_selection: true"

**Solutions:**
- User has multiple roles
- Call `/api/v1/auth/select-role/` with desired role
- Then proceed with authenticated requests

### Permission Denied

**Symptoms:** "You do not have permission to perform this action"

**Solutions:**
- Verify user has correct role assigned
- Check active role in JWT token
- Verify permission class on view
- Check object-level permissions (IsOwnerOrReadOnly)

## Environment Variables

### Variables Not Loading

**Symptoms:** Configuration not applied, defaults used

**Solutions:**
```bash
# For local development
# Verify .env file exists and is in correct location
ls -la .env

# Check .env file format (no spaces around =)
DEBUG=False
SECRET_KEY=your-key

# For Docker
# Verify env_file in docker-compose.yml
env_file:
  - .env

# For Render/Production
# Verify variables set in platform dashboard
# NOT from .env file - must be set manually
```

### Wrong Settings Module

**Symptoms:** Wrong configuration applied

**Solutions:**
```bash
# Check DJANGO_SETTINGS_MODULE
echo $DJANGO_SETTINGS_MODULE

# For local
export DJANGO_SETTINGS_MODULE=placemate.settings.local

# For production
export DJANGO_SETTINGS_MODULE=placemate.settings.production

# In docker-compose.yml
environment:
  - DJANGO_SETTINGS_MODULE=placemate.settings.local
```

## Static Files

### Static Files Not Loading

**Symptoms:** 404 errors for static files, CSS/JS not loading

**Solutions:**
```bash
# Collect static files
python manage.py collectstatic --noinput

# For Docker
docker-compose exec backend python manage.py collectstatic --noinput

# Check STATIC_ROOT permissions
ls -la staticfiles/

# Verify WhiteNoise configuration
# Check STATICFILES_STORAGE in settings

# Check static files exist
ls -la staticfiles/admin/
```

### Media Files Not Uploading

**Symptoms:** File uploads fail or files not accessible

**Solutions:**
```bash
# Check MEDIA_ROOT permissions
ls -la media/

# Verify Cloudinary configuration (production)
# Check CLOUDINARY_* environment variables

# Test Cloudinary connection
python manage.py shell
from cloudinary import uploader
uploader.upload("test.jpg")
```

## Email Issues

### Emails Not Sending

**Symptoms:** No emails received, no errors in logs

**Solutions:**
```bash
# Check Brevo API key
echo $BREVO_API_KEY

# Verify DEFAULT_FROM_EMAIL
echo $DEFAULT_FROM_EMAIL

# Check email backend in settings
# Should be: anymail.backends.brevo.EmailBackend

# Test email sending
python manage.py shell
from django.core.mail import send_mail
send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])

# Check email logs (if using console backend in development)
```

### Email Template Errors

**Symptoms:** TemplateDoesNotExist or template rendering errors

**Solutions:**
- Verify template exists in `templates/emails/`
- Check template path in code
- Verify template syntax
- Check template context variables

## Performance Issues

### Slow API Responses

**Symptoms:** API requests take too long

**Solutions:**
```bash
# Check database queries
# Enable query logging (see Development Guide)

# Use select_related for foreign keys
queryset.select_related('user', 'company')

# Use prefetch_related for many-to-many
queryset.prefetch_related('roles', 'eligible_programs')

# Add database indexes
# Check slow query log

# Monitor with Django Debug Toolbar (development)
```

### High Memory Usage

**Symptoms:** Server runs out of memory

**Solutions:**
- Reduce Gunicorn workers
- Optimize database queries
- Clear cache
- Check for memory leaks
- Monitor with `docker stats`

### Database Connection Pool Exhausted

**Symptoms:** "too many connections" error

**Solutions:**
- Reduce `CONN_MAX_AGE` in settings
- Increase database connection limit
- Use connection pooling
- Close connections properly

## Testing Issues

### Tests Failing

**Symptoms:** Test failures, especially with --keepdb

**Solutions:**
```bash
# Clear test database
python manage.py flush

# Run without --keepdb
pytest --no-migrations

# Check test data setup
# Verify fixtures are loaded
# Check factory usage

# Run specific test
pytest apps/core/tests/test_models.py::TestCountryModel
```

### Test Database Issues

**Symptoms:** "table does not exist" or migration errors in tests

**Solutions:**
```bash
# Run migrations in test database
python manage.py migrate --database=default

# Use --keepdb carefully
# Some tests may need fresh database

# Check test settings
# Verify test database configuration
```

### Coverage Not Working

**Symptoms:** Coverage report not generated

**Solutions:**
```bash
# Install coverage
pip install coverage pytest-cov

# Run with coverage
pytest --cov=apps --cov-report=html

# Check coverage configuration
# Verify .coveragerc or setup.cfg
```

## General Issues

### Import Errors

**Symptoms:** ImportError or ModuleNotFoundError

**Solutions:**
```bash
# Verify virtual environment is activated
which python

# Reinstall dependencies
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"

# Verify app is in INSTALLED_APPS
```

### CORS Errors

**Symptoms:** "CORS policy" errors in browser

**Solutions:**
- Check `CORS_ALLOWED_ORIGINS` in settings
- Verify `FRONTEND_URL` is set correctly
- Check `CORS_ALLOW_CREDENTIALS = True`
- Verify frontend origin matches allowed origins
- Check CSRF_TRUSTED_ORIGINS matches CORS origins

### Health Check Failing

**Symptoms:** `/health/` endpoint returns error

**Solutions:**
```bash
# Check health check endpoint
curl http://localhost:8000/health/

# Verify django-health-check is installed
pip list | grep django-health-check

# Check health check configuration
# Verify health_check.urls is included
```

## Getting Help

If you're still experiencing issues:

1. Check logs: `docker-compose logs backend` or Django logs
2. Review [Architecture Documentation](ARCHITECTURE.md)
3. Review [Development Guide](DEVELOPMENT.md)
4. Check GitHub issues for similar problems
5. Create a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs

## Useful Commands

```bash
# Check Django configuration
python manage.py check

# Show all URLs
python manage.py show_urls

# Database shell
python manage.py dbshell

# Django shell
python manage.py shell

# View migrations
python manage.py showmigrations

# Collect static files
python manage.py collectstatic

# Docker logs
docker-compose logs -f backend

# Docker shell
docker-compose exec backend bash

# Test Docker setup
./test-docker.sh
```
