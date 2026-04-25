#!/bin/bash
set -e

echo "===== Application Startup at $(date -u '+%Y-%m-%d %H:%M:%S') ====="
echo ""
echo "===== Cricket Highlight Generator Startup ====="

# 1. Start Redis in the background
echo "[1/4] Starting Redis server..."
redis-server --daemonize yes
sleep 2

# 2. Run Django Migrations
echo "[2/4] Running migrations..."
cd /app/backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
cd /app

# Set PYTHONPATH so both 'cricket_highlights' (in /app/backend) 
# and 'processing_engine' (in /app) are importable
export PYTHONPATH=/app/backend:/app:$PYTHONPATH

# Create required media directories with full permissions
mkdir -p /app/media/uploads /app/media/results /app/media/cricket_sessions /app/media/cricket_results
chmod -R 777 /app/media

# 3. Start Celery Worker (runs from /app/backend so cricket_highlights app is found)
echo "[3/4] Starting Celery worker..."
cd /app/backend
celery -A cricket_highlights worker --loglevel=info --concurrency=1 &
cd /app

# 4. Start Django Development Server (HF uses port 7860)
echo "[4/4] Starting Django server on port ${PORT:-7860}..."
cd /app/backend
python manage.py runserver 0.0.0.0:${PORT:-7860}
