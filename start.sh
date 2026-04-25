#!/bin/bash

# Start Redis server in the background
echo "Starting Redis server..."
redis-server --daemonize yes

# Wait for redis to start
sleep 2

# Run migrations
echo "Running migrations..."
python backend/manage.py migrate

# Start Celery worker in the background
echo "Starting Celery worker..."
celery -A cricket_highlights worker --loglevel=info --concurrency=1 &

# Start Django server
echo "Starting Django server..."
# Note: Using 0.0.0.0:7860 as required by Hugging Face
python backend/manage.py runserver 0.0.0.0:7860
