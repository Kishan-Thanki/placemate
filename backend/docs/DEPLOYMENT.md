# Deployment Guide

Complete guide for deploying Placemate Backend to various platforms.

## Overview

The backend is fully containerized with Docker, supporting both local development and production deployments on any Docker-compatible platform.

## Prerequisites

- Docker installed (version 20.x or higher)
- Docker Compose installed (version 1.29 or higher)
- `.env` file configured with required variables

## Local Development Testing

### Quick Start

```bash
# 1. Create .env file (see Environment Variables section)
# 2. Build and start
docker-compose up --build

# 3. Verify
curl http://localhost:8000/health
```

### Common Commands

```bash
docker-compose up              # Start
docker-compose down            # Stop
docker-compose logs -f backend # View logs
docker-compose exec backend python manage.py migrate  # Run migrations
docker-compose exec backend python manage.py createsuperuser  # Create admin
```

## Production Deployment

### Build and Run Locally (for Testing)

```bash
docker build -t placemate-backend:latest .
docker run -d --name placemate-backend -p 8000:8000 --env-file .env \
  -e DJANGO_SETTINGS_MODULE=placemate.settings.production \
  placemate-backend:latest
```

### Or Use Production Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `DEBUG` | Debug mode | `False` |
| `SECRET_KEY` | Django secret key | Generate with Django |
| `DJANGO_SETTINGS_MODULE` | Settings module | `placemate.settings.production` |
| `DATABASE_URL` | Supabase PostgreSQL connection | `postgresql://user:pass@host:port/db` |
| `FRONTEND_URL` | Frontend application URL | `https://frontend.com` |
| `BREVO_API_KEY` | Brevo email API key | From Brevo dashboard |
| `DEFAULT_FROM_EMAIL` | Default sender email | `noreply@yourdomain.com` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | From Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary API key | From Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | From Cloudinary |

### Optional

- `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` (default: 60)
- `JWT_REFRESH_TOKEN_LIFETIME_DAYS` (default: 7)
- `ALLOWED_HOSTS` (comma-separated, defaults to `.onrender.com,localhost,127.0.0.1`)
- `CORS_ADDITIONAL_ORIGINS` (comma-separated additional CORS origins)

## Deployment Strategies

### Strategy 1: Build from Source (Recommended)

**How it works:**
- Platform (Render/Railway) connects to your GitHub repo
- On every commit, platform builds Docker image from source
- Platform runs the built image

**Pros:**
- Simple setup - just connect repo
- Automatic deployments on every commit
- No need to manage container registry
- Free for most platforms

**Best for:** Most projects, especially Render and Railway

### Strategy 2: Push to Container Registry

**How it works:**
- Build Docker image locally or in CI
- Push image to registry (Docker Hub, GitHub Container Registry)
- Platform pulls pre-built image from registry

**Pros:**
- Faster deployments (no build on platform)
- Build once, deploy anywhere
- Can test image before deploying

**Best for:** When you need faster deployments or multiple deployment targets

## Deployment Platforms

### Render (Recommended)

**Setup Steps:**

1. **New Web Service** → Select "Docker" as Language
2. **Source Code:** Connect your GitHub repository
3. **Branch:** Select your branch (e.g., `main` or `dev`)
4. **Root Directory:** Set to `backend/` (important for monorepo)
5. **Instance Type:** Choose Free (for testing) or paid tier
6. **Environment Variables:** Click "Add Environment Variable" and add each variable:
   - `DEBUG=False`
   - `SECRET_KEY=secret-key`
   - `DJANGO_SETTINGS_MODULE=placemate.settings.production`
   - `DATABASE_URL=supabase-connection-string`
   - `FRONTEND_URL=frontend-url`
   - `BREVO_API_KEY=brevo-key`
   - `DEFAULT_FROM_EMAIL=email`
   - `CLOUDINARY_CLOUD_NAME=cloud-name`
   - `CLOUDINARY_API_KEY=api-key`
   - `CLOUDINARY_API_SECRET=api-secret`
   - `JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60` (optional)
   - `JWT_REFRESH_TOKEN_LIFETIME_DAYS=7` (optional)
7. **Build & Deploy:** Render auto-detects Dockerfile and deploys

**Important Notes:**
- **Root Directory:** Must be `backend/` if your Dockerfile is in the backend folder (required for monorepo)
- **Environment Variables:** 
  - Click "Add Environment Variable" for each variable
  - The "Add from .env" button is just a helper to paste .env content - you still need to add each variable manually
  - Render does NOT automatically read .env files from your repository
- **Build/Start Commands:** Leave empty - Render auto-detects from Dockerfile
- **Auto-Deploy:** Enabled by default on push to selected branch

### Railway

1. Connect repository
2. Railway auto-detects Dockerfile
3. Add environment variables in dashboard
4. Auto-deploy on push

### Fly.io

```bash
flyctl install
fly launch  # Auto-detects Dockerfile
fly secrets set KEY=value
fly deploy
```

### AWS ECS / Fargate

Requires container registry. Build and push to ECR, then create ECS task definition.

## Production Considerations

### Gunicorn Workers

Default is 1 worker (optimized for Render free tier). Adjust based on CPU cores: (2 × CPU) + 1

- 1 CPU: `--workers 2`
- 2 CPU: `--workers 4`
- 4 CPU: `--workers 8`

Edit `Dockerfile` CMD to adjust worker count.

### Static Files

Collected automatically on container startup via `entrypoint.sh`

### Database Migrations

Run automatically on container startup via `entrypoint.sh`

### Security

- Container runs as non-root user (`appuser`)
- Security headers middleware enabled
- HTTPS enforced in production
- CORS configured for frontend domain

### Health Checks

Database connection checked before startup (30 attempts, 2s intervals)

### Timeout

Default 90s. Increase for heavy operations: `--timeout 300`

### Memory Limits

Set in docker-compose or platform settings. Monitor with `docker stats placemate-backend`

## Docker Files

- `Dockerfile` - Multi-stage build for optimized production image
- `docker-compose.yml` - Local development with hot reload
- `docker-compose.prod.yml` - Production-like configuration
- `entrypoint.sh` - Startup script (migrations, static files, database wait)
- `.dockerignore` - Excludes unnecessary files from build context
- `test-docker.sh` - Automated testing script

## Using Container Registry (Optional)

### Docker Hub

```bash
# Build and tag
docker build -t yourusername/placemate-backend:latest .
docker build -t yourusername/placemate-backend:v1.0.0 .

# Login
docker login

# Push
docker push yourusername/placemate-backend:latest
docker push yourusername/placemate-backend:v1.0.0
```

### GitHub Container Registry (GHCR)

```bash
# Build and tag
docker build -t ghcr.io/yourusername/placemate-backend:latest .

# Login (use GitHub Personal Access Token)
echo $GITHUB_TOKEN | docker login ghcr.io -u yourusername --password-stdin

# Push
docker push ghcr.io/yourusername/placemate-backend:latest
```

**Then on Render:**
- Select "Docker" service type
- Specify image: `username/placemate-backend:latest`
- Set environment variables
- Deploy

## Troubleshooting

See [Troubleshooting Guide](TROUBLESHOOTING.md) for common deployment issues.
