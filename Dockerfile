# --- STAGE 1: Frontend Build ---
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- STAGE 2: Python Backend & Final Image ---
FROM python:3.10-slim

# System dependencies (FFmpeg and Redis are critical)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python environment settings
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 7860
ENV PYTHONPATH=/app/backend

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Copy built frontend from Stage 1 to Django's static folder
COPY --from=frontend-builder /app/backend/static/react ./backend/static/react

# Copy startup script
COPY start.sh .
RUN chmod +x start.sh

# Create media and static folders if they don't exist
RUN mkdir -p /app/media /app/backend/staticfiles

# Permissions for Hugging Face
RUN chmod -R 777 /app

# Expose Hugging Face default port
EXPOSE 7860

# Start everything via start.sh
CMD ["/bin/bash", "start.sh"]
