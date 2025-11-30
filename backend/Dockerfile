# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Start command
# We use a shell form to allow variable expansion if needed, but exec form is preferred.
# We will run migrations and collectstatic in the deployment platform (Render) usually,
# but for a Docker container, it's often good to have an entrypoint script.
# For now, I'll set the default command to run gunicorn.
# Users can override this or we can add a start.sh later if complex logic is needed.
CMD ["gunicorn", "placemate.wsgi:application", "--bind", "0.0.0.0:8000"]
