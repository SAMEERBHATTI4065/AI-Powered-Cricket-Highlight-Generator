#!/bin/bash
set -e

# Ensure folders exist
mkdir -p /app/logs /app/media/uploads /app/media/results /app/backend/staticfiles
chmod -R 777 /app/media /app/logs /app/backend/staticfiles

# 1. Start Redis in background
echo "Starting Redis server..."
redis-server --daemonize yes
sleep 2

# 2. Run Django Migrations
echo "Running database migrations..."
cd /app/backend
python manage.py migrate --noinput

# 3. Start Celery Worker (Optimized for limited CPU)
echo "Starting Celery worker (concurrency=1)..."
celery -A cricket_highlights worker --loglevel=info --concurrency=1 --logfile=/app/logs/worker.log &

# 4. Start Gunicorn Server (Production grade)
# Using gthread for better concurrency on limited resources
echo "Starting Gunicorn server on port ${PORT:-7860}..."
gunicorn cricket_highlights.wsgi:application \
    --bind 0.0.0.0:${PORT:-7860} \
    --workers 2 \
    --threads 4 \
    --worker-class gthread \
    --timeout 600 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
