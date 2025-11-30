# Placemate Backend

Django REST API for placement management system with JWT authentication, role-based access control, and Docker deployment.

## Documentation

- **[Quick Start](docs/QUICKSTART.md)** - Get running in 5 minutes
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Docker, Render, Railway, etc.
- **[API Reference](docs/API.md)** - Endpoints, authentication, examples
- **[Architecture](docs/ARCHITECTURE.md)** - System design & components
- **[Development Guide](docs/DEVELOPMENT.md)** - Contributing & testing
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues & solutions

## Quick Start

### Local Development (Without Docker)

```bash
# Setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Edit with your values

# Database
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver
```

### Local Development (With Docker)

```bash
# Build and run
docker-compose up --build

# Access
# API: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### Deploy to Render

1. New Web Service → Select "Docker"
2. Connect GitHub repository
3. Set Root Directory to `backend/`
4. Add environment variables in "Environment Variables" section
5. Deploy automatically on push

## Features

- JWT Authentication with HTTP-only cookies
- Role-Based Access Control (Admin, Student, Placement Team)
- Student Placement Management
- Company & Drive Management
- Application & Job Offer System
- Email Notifications (Brevo)
- File Upload (Cloudinary)
- Docker Support for all environments
- REST API with standardized responses

## Requirements

- Python 3.11+
- PostgreSQL (Supabase recommended)
- Docker & Docker Compose (for containerized deployment)

## Environment Setup

Create `.env` file with:

```env
DEBUG=False
SECRET_KEY=secret-key
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000
BREVO_API_KEY=brevo-key
CLOUDINARY_URL=cloudinary://...
```

## Deployment

### One-Click Deploy

Supported platforms: Render, Railway, Fly.io, Heroku, AWS, Azure, GCP

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [Development Guide](docs/DEVELOPMENT.md) for details.

## Support

- Documentation: Check the [`docs`](docs) directory
- Issues: Create a GitHub issue
- Email: Contact the development team

## License

[MIT LICENSE](../LICENSE) --- see LICENSE file for details.
