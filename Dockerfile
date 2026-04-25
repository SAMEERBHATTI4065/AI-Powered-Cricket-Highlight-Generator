# --- STAGE 1: Frontend Build ---
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- STAGE 2: Python Backend & Final Image ---
FROM python:3.10-slim

# System dependencies (FFmpeg is critical for video cutting)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python environment settings
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 7860

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Copy built frontend from Stage 1 to Django's static folder
COPY --from=frontend-builder /app/frontend/dist ./backend/static/react

# Create media and static folders if they don't exist
RUN mkdir -p /app/media /app/backend/staticfiles

# Database Migrations (SQLite)
RUN python backend/manage.py migrate

# Permissions for Hugging Face
RUN chmod -R 777 /app

# Expose Hugging Face default port
EXPOSE 7860

# Start Django Server
# Note: We use 0.0.0.0 so it's accessible outside the container
CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:7860"]
