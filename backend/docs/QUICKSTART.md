# Quick Start Guide

Get Placemate Backend running in under 5 minutes.

## Option 1: Docker (Recommended)

### Prerequisites

- Docker Desktop
- Docker Compose

### Steps

```bash
# 1. Clone and setup
git clone https://github.com/Kishan-Thanki/placemate.git
cd backend

# 2. Configure environment
cp .env.example .env
# Edit .env with your database and API keys

# 3. Start services
docker-compose up --build

# 4. Access the application
# API: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### First-Time Setup

```bash
# Create superuser (in new terminal)
docker-compose exec backend python manage.py createsuperuser
```

## Option 2: Local Python Setup

### Prerequisites

- Python 3.11+
- PostgreSQL
- pip

### Steps

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Setup database
python manage.py migrate
python manage.py createsuperuser

# 5. Run development server
python manage.py runserver
```

## Verify Installation

- Health Check: http://localhost:8000/health
- Admin Panel: http://localhost:8000/admin/
- API Docs: http://localhost:8000/redoc

## Next Steps

- Configure Email - Set up Brevo for notifications
- Setup Cloudinary - For file uploads
- Add Companies - Through admin panel
- Create Placement Drives - Start managing placements

## Environment Variables

Required environment variables:

```env
# Django Core Settings
DEBUG=False
SECRET_KEY=secret-key-here
DJANGO_SETTINGS_MODULE=placemate.settings.local

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (Brevo)
BREVO_API_KEY=brevo-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=cloud-name
CLOUDINARY_API_KEY=api-key
CLOUDINARY_API_SECRET=api-secret

# JWT Settings (Optional)
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

## Need Help?

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Deployment Guide](DEPLOYMENT.md) for production setup
- Create a GitHub issue
- Contact development team
