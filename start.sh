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
    echo "$LOG_START Downloading demo video (${DEMO_SIZE} bytes < 1MB, likely LFS pointer)..." | tee -a /app/logs/startup.log
    # Use the match video from uploads if it exists and is large enough
    MATCH_VIDEO="/app/media/uploads/cricket_full_match.mp4"
    MATCH_SIZE=$(stat -c%s "$MATCH_VIDEO" 2>/dev/null || echo 0)
    if [ "$MATCH_SIZE" -gt 1048576 ]; then
        echo "$LOG_START Using cricket_full_match.mp4 as demo video source" | tee -a /app/logs/startup.log
        cp "$MATCH_VIDEO" "$DEMO_VIDEO"
    else
        echo "$LOG_START Downloading demo video from CDN..." | tee -a /app/logs/startup.log
        curl -L --max-time 300 --retry 3 \
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4" \
            -o "$DEMO_VIDEO" 2>&1 | tee -a /app/logs/startup.log || \
        curl -L --max-time 300 --retry 2 \
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" \
            -o "$DEMO_VIDEO" 2>&1 | tee -a /app/logs/startup.log || \
        echo "$LOG_START WARNING: Could not download demo video. Will use CDN fallback at runtime." | tee -a /app/logs/startup.log
    fi
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
# Use concurrency=1 on limited CPU (HF) to ensure stability, or 2 on larger machines
CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-1}
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
