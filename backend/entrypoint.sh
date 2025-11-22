#!/bin/bash
set -e

echo "Starting Placemate Backend..."

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

echo "Setup complete! Starting server..."

# Execute the command passed as arguments
exec "$@"