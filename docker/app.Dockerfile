# Unified Dockerfile for CricketAI (Backend + Worker + Frontend Build)

# --- Stage 1: Build Frontend ---
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build frontend - outputs to ../backend/static/react (as per vite.config.ts)
RUN npm run build

# --- Stage 2: Final App Image ---
FROM python:3.11-slim
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    tesseract-ocr \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgeos-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools==69.5.1 wheel
RUN pip install --no-cache-dir numpy==1.26.4 scipy==1.12.0
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/
COPY processing_engine/ ./processing_engine/

# Copy built frontend from Stage 1
# Note: Vite build should put files in /app/backend/static/react (adjust if necessary)
COPY --from=frontend-builder /app/backend/static/react ./backend/static/react

# Create necessary directories
RUN mkdir -p /app/logs /app/media /root/.EasyOCR/model

# Pre-download EasyOCR models (ensure this matches requirements)
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# Default command (can be overridden in docker-compose)
CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]
