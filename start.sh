#!/bin/bash
set -e

# Ensure folders exist
mkdir -p /app/logs /app/media/uploads /app/media/results
chmod -R 777 /app/media /app/logs

LOG_START="[$(date -u '+%Y-%m-%d %H:%M:%S')]"
echo "$LOG_START ===== Cricket Highlight Generator Startup =====" | tee -a /app/logs/startup.log

# Diagnostic: Check OpenAI Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "$LOG_START ⚠️  WARN: OPENAI_API_KEY is not set. Summary generation will use fallback text." | tee -a /app/logs/startup.log
else
    # Show only the last 4 characters of the key for security
    MASKED_KEY="...${OPENAI_API_KEY: -4}"
    echo "$LOG_START ✅ INFO: OPENAI_API_KEY is present ($MASKED_KEY). AI Summaries enabled." | tee -a /app/logs/startup.log
fi

# 1. Start Redis
redis-server --daemonize yes
sleep 2

# 2. Run Django Migrations (fast check)
cd /app/backend
python manage.py migrate --noinput 2>&1 | tee -a /app/logs/startup.log
python manage.py collectstatic --noinput 2>&1 | tee -a /app/logs/startup.log
cd /app

# PYTHONPATH is set in Dockerfile, but ensuring /app is included
export PYTHONPATH=/app/backend:/app:$PYTHONPATH

# 3. Start Celery Worker
echo "Starting Celery worker (concurrency optimized)..." | tee -a /app/logs/startup.log
cd /app/backend
# Use concurrency=1 on limited CPU (HF) to ensure stability, or 2 on larger machines
CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-1}
celery -A cricket_highlights worker --loglevel=info --concurrency=$CELERY_CONCURRENCY 2>&1 | tee -a /app/logs/worker.log &
cd /app

# 4. Start Gunicorn Server (Production grade)
echo "Starting Gunicorn server on port ${PORT:-7860}..." | tee -a /app/logs/startup.log

# Show the startup logs collected so far to stdout
echo "--- STARTUP DIAGNOSTICS ---"
cat /app/logs/startup.log
echo "--- END DIAGNOSTICS ---"

cd /app/backend
gunicorn cricket_highlights.wsgi:application \
    --bind 0.0.0.0:${PORT:-7860} \
    --workers 1 \
    --threads 4 \
    --worker-class gthread \
    --timeout 600 \
    --access-logfile - \
    --error-logfile - \
    2>&1 | tee -a /app/logs/backend.log
