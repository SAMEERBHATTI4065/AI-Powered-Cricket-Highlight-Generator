#!/bin/bash
set -e

# Create required directories
mkdir -p /app/logs
mkdir -p /app/media/uploads /app/media/results /app/media/cricket_sessions /app/media/cricket_results
chmod -R 777 /app/media /app/logs

echo "===== Application Startup at $(date -u '+%Y-%m-%d %H:%M:%S') =====" | tee -a /app/logs/startup.log
echo "" | tee -a /app/logs/startup.log
echo "===== Cricket Highlight Generator Startup =====" | tee -a /app/logs/startup.log

# 1. Start Redis in the background
echo "[1/4] Starting Redis server..." | tee -a /app/logs/startup.log
redis-server --daemonize yes
sleep 2

# 2. Run Django Migrations
echo "[2/4] Running migrations..." | tee -a /app/logs/startup.log
cd /app/backend
python manage.py migrate --noinput 2>&1 | tee -a /app/logs/startup.log
python manage.py collectstatic --noinput 2>&1 | tee -a /app/logs/startup.log
cd /app

# Set PYTHONPATH
export PYTHONPATH=/app/backend:/app:$PYTHONPATH

# 3. Start Celery Worker
echo "[3/4] Starting Celery worker..." | tee -a /app/logs/startup.log
cd /app/backend
# Redirect Celery output to worker.log while keeping it in stdout
celery -A cricket_highlights worker --loglevel=info --concurrency=1 2>&1 | tee -a /app/logs/worker.log &
cd /app

# 4. Start Django Development Server
echo "[4/4] Starting Django server on port ${PORT:-7860}..." | tee -a /app/logs/startup.log
cd /app/backend
# Redirect Django output to backend.log while keeping it in stdout
python manage.py runserver 0.0.0.0:${PORT:-7860} 2>&1 | tee -a /app/logs/backend.log
