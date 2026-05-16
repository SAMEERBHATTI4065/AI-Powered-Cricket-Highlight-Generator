#!/bin/bash
set -x

# Ensure folders exist
mkdir -p /app/logs /app/media/uploads /app/media/results
chmod -R 777 /app/media /app/logs

# 1. Start Redis
redis-server --daemonize yes

# 2. Run Migrations
cd /app/backend
python manage.py migrate --noinput

# 3. Start Celery Worker (background)
echo "Starting Celery worker..."
celery -A cricket_highlights worker --loglevel=info --concurrency=1 > /app/logs/worker.log 2>&1 &

# 4. Start Django (using runserver for debugging)
echo "Starting Django on port ${PORT:-7860}..."
python manage.py runserver 0.0.0.0:${PORT:-7860}
