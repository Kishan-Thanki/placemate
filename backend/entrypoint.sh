#!/bin/bash
set -e

echo "Starting Placemate Backend..."

# Wait for database to be ready (if using external DB, this will timeout gracefully)
echo "Waiting for database connection..."
python << END
import sys
import time
import psycopg2
from decouple import config
import dj_database_url

max_attempts = 30
attempt = 0

while attempt < max_attempts:
    try:
        database_url = config('DATABASE_URL', default='')
        if database_url:
            db_config = dj_database_url.parse(database_url)
            conn = psycopg2.connect(
                host=db_config.get('HOST', 'localhost'),
                port=db_config.get('PORT', 5432),
                user=db_config.get('USER', ''),
                password=db_config.get('PASSWORD', ''),
                dbname=db_config.get('NAME', ''),
                connect_timeout=5
            )
            conn.close()
            print("Database connection successful!")
            sys.exit(0)
        else:
            print("DATABASE_URL not set, skipping database check...")
            sys.exit(0)
    except Exception as e:
        attempt += 1
        if attempt < max_attempts:
            print(f"Database not ready yet... (attempt {attempt}/{max_attempts})")
            time.sleep(2)
        else:
            print(f"Could not connect to database after {max_attempts} attempts")
            print(f"Error: {str(e)}")
            sys.exit(1)
END

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "Static files collection failed, continuing..."

# Create superuser if it doesn't exist (optional, for initial setup)
# Uncomment if needed:
# echo "Creating superuser (if not exists)..."
# python manage.py shell << END
# from apps.users.models import User
# if not User.objects.filter(email='admin@example.com').exists():
#     User.objects.create_superuser('admin@example.com', 'admin123')
#     print("Superuser created!")
# END

echo "Setup complete! Starting server..."

# Execute the command passed as arguments
exec "$@"

