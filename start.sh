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

# 2. Ensure test/demo video exists — auto-download if missing (HF ephemeral storage fix)
mkdir -p /app/media/uploads /app/backend/static/demo
echo "$LOG_START Checking test video..." | tee -a /app/logs/startup.log
TEST_VIDEO="/app/media/uploads/cricket_full_match.mp4"
TEST_SIZE=$(stat -c%s "$TEST_VIDEO" 2>/dev/null || echo 0)

# If video is missing or is an LFS pointer (<1MB), download from CDN
if [ "$TEST_SIZE" -lt 1048576 ]; then
    echo "$LOG_START Test video missing or invalid (${TEST_SIZE} bytes). Downloading..." | tee -a /app/logs/startup.log
    python3 -c "
import urllib.request, shutil, os
urls = [
    'https://media.githubusercontent.com/media/SAMEERBHATTI4065/AI-Powered-Cricket-Highlight-Generator/main/media/uploads/cricket_full_match.mp4',
    'https://huggingface.co/spaces/Sameer4065/cricket-gen/resolve/main/media/uploads/cricket_full_match.mp4'
]
dest = '/app/media/uploads/cricket_full_match.mp4'
tmp = dest + '.tmp'
for url in urls:
    try:
        print(f'Trying: {url}')
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=120) as r, open(tmp, 'wb') as f:
            shutil.copyfileobj(r, f)
        if os.path.getsize(tmp) > 1048576:
            if os.path.exists(dest):
                os.remove(dest)
            os.rename(tmp, dest)
            print(f'SUCCESS: Downloaded {os.path.getsize(dest)} bytes')
            break
        else:
            os.remove(tmp)
            print(f'SKIP: File too small from {url}')
    except Exception as e:
        print(f'FAIL: {e}')
        if os.path.exists(tmp):
            os.remove(tmp)
" 2>&1 | tee -a /app/logs/startup.log
    TEST_SIZE=$(stat -c%s "$TEST_VIDEO" 2>/dev/null || echo 0)
fi
echo "$LOG_START Test video: ${TEST_SIZE} bytes" | tee -a /app/logs/startup.log

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
