# --- STAGE 1: Frontend Build ---
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- STAGE 2: Python Backend & Final Image ---
FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    redis-server \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python environment settings
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 7860
ENV PYTHONPATH=/app/backend:/app
ENV HOME=/app

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download EasyOCR models into a persistent location
RUN python -c "import easyocr; reader = easyocr.Reader(['en'], gpu=False)"

# Copy backend and processing engine first for better layer caching
COPY backend/ /app/backend/
COPY processing_engine/ /app/processing_engine/
COPY start.sh /app/start.sh

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/backend/static/react /app/backend/static/react

# Create necessary folders and set permissions
RUN mkdir -p /app/logs /app/media/uploads /app/media/results /app/temp /app/backend/staticfiles
COPY media/uploads/cricket_full_match.mp4* /app/media/uploads/
RUN chmod -R 777 /app

# Run collectstatic during build to save time on startup
RUN cd backend && python manage.py collectstatic --noinput

# Start via start.sh
CMD ["/bin/bash", "start.sh"]
