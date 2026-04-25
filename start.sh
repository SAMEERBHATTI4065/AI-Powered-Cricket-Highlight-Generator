#!/bin/bash
set -e

echo "===== Cricket Highlight Generator Startup ====="

# 1. Start Redis in the background
echo "[1/4] Starting Redis server..."
redis-server --daemonize yes
sleep 2

# 2. Run Django Migrations
echo "[2/4] Running migrations..."
python backend/manage.py migrate --noinput
python backend/manage.py collectstatic --noinput

# 3. Start Celery Worker
# We use --concurrency=1 to save memory on Hugging Face Free Tier
echo "[3/4] Starting Celery worker..."
celery -A cricket_highlights worker --loglevel=info --concurrency=1 &

# 4. Start Django Development Server (HF uses port 7860)
echo "[4/4] Starting Django server on port $PORT..."
python backend/manage.py runserver 0.0.0.0:$PORT
