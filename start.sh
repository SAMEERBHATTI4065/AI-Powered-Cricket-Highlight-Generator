#!/bin/bash
set -e

# Ensure folders exist
mkdir -p /app/logs /app/media/uploads /app/media/results
chmod -R 777 /app/media /app/logs

LOG_START="[$(date -u '+%Y-%m-%d %H:%M:%S')]"
echo "$LOG_START ===== Cricket Highlight Generator Startup =====" | tee -a /app/logs/startup.log

# 1. Start Redis
redis-server --daemonize yes
sleep 2

# 2. Ensure demo video is present (real file, not LFS pointer)
DEMO_VIDEO="/app/backend/static/demo/demo-video.mp4"
DEMO_SIZE=$(stat -c%s "$DEMO_VIDEO" 2>/dev/null || echo 0)
if [ "$DEMO_SIZE" -lt 1048576 ]; then
    echo "$LOG_START Downloading real cricket demo video..." | tee -a /app/logs/startup.log
    curl -L --max-time 300 --retry 3 \
        "https://media.githubusercontent.com/media/SAMEERBHATTI4065/AI-Powered-Cricket-Highlight-Generator/main/backend/static/demo/demo-video.mp4" \
        -o "$DEMO_VIDEO" 2>&1 | tee -a /app/logs/startup.log || \
    curl -L --max-time 300 --retry 2 \
        "https://huggingface.co/spaces/Sameer4065/cricket-gen/resolve/main/backend/static/demo/demo-video.mp4" \
        -o "$DEMO_VIDEO" 2>&1 | tee -a /app/logs/startup.log || \
    echo "$LOG_START WARNING: Could not download demo video. Will use CDN fallback at runtime." | tee -a /app/logs/startup.log
else
    echo "$LOG_START Demo video OK (${DEMO_SIZE} bytes)" | tee -a /app/logs/startup.log
fi

# 3. Run Django Migrations (fast check)
cd /app/backend
python manage.py migrate --noinput 2>&1 | tee -a /app/logs/startup.log
python manage.py collectstatic --noinput 2>&1 | tee -a /app/logs/startup.log
cd /app

# PYTHONPATH is set in Dockerfile, but ensuring /app is included
export PYTHONPATH=/app/backend:/app:$PYTHONPATH

# Automatically write Google Cloud credentials if provided as a raw JSON env var
if [ -n "$GOOGLE_CREDENTIALS_JSON" ]; then
    echo "Google Credentials JSON detected. Writing to /app/google-credentials.json..."
    echo "$GOOGLE_CREDENTIALS_JSON" > /app/google-credentials.json
    export GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
fi

# 3. Start Celery Worker
echo "Starting Celery worker (concurrency optimized)..." | tee -a /app/logs/startup.log
cd /app/backend
# Use concurrency=2 to allow parallel execution of emails and video processing
CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-2}
celery -A cricket_highlights worker --loglevel=info --concurrency=$CELERY_CONCURRENCY 2>&1 | tee -a /app/logs/worker.log &
cd /app

# 4. Start Gunicorn Server (Production grade)
echo "Starting Gunicorn server on port ${PORT:-7860}..." | tee -a /app/logs/startup.log
cd /app/backend
# Use 2 workers for 2 vCPUs (standard for HF Spaces)
gunicorn cricket_highlights.wsgi:application \
    --bind 0.0.0.0:${PORT:-7860} \
    --workers 2 \
    --worker-class gthread \
    --threads 4 \
    --timeout 600 \
    --keep-alive 5 \
    --access-logfile /app/logs/gunicorn_access.log \
    --error-logfile /app/logs/gunicorn_error.log \
    2>&1 | tee -a /app/logs/backend.log
