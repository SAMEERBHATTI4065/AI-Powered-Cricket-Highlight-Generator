# Backend Dockerfile - Django REST API
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements-api.txt ./requirements.txt

# Upgrade pip and install requirements
RUN pip install --no-cache-dir --upgrade pip setuptools==69.5.1 wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/
COPY processing_engine/ ./processing_engine/

# Create necessary directories
RUN mkdir -p /app/logs /app/media /app/temp /app/event_analysis /root/.EasyOCR/model

# Set PYTHONPATH and Expose port
ENV PYTHONPATH=/app/backend
EXPOSE 8000

# Run Django development server
CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]

