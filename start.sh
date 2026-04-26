#!/bin/bash
set -e

# Ensure folders exist
mkdir -p /app/logs /app/media/uploads /app/media/results
chmod -R 777 /app/media /app/logs

LOG_START="[$(date -u '+%Y-%m-%d %H:%M:%S')]"
echo "$LOG_START ===== Cricket Highlight Generator Startup =====" | tee -a /app/logs/startup.log

# 1. Start Redis
redis-server --daemonize yes

# 2. Run Django Migrations (fast check)
cd /app/backend
python manage.py migrate --noinput 2>&1 | tee -a /app/logs/startup.log
cd /app

# PYTHONPATH is set in Dockerfile, but ensuring /app is included
export PYTHONPATH=/app/backend:/app:$PYTHONPATH

# 3. Start Celery Worker
echo "Starting Celery worker..." | tee -a /app/logs/startup.log
cd /app/backend
celery -A cricket_highlights worker --loglevel=info --concurrency=1 2>&1 | tee -a /app/logs/worker.log &
cd /app

# 4. Start Django Server
echo "Starting Django server on port ${PORT:-7860}..." | tee -a /app/logs/startup.log
cd /app/backend
python manage.py runserver 0.0.0.0:${PORT:-7860} 2>&1 | tee -a /app/logs/backend.log
