FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    PIP_NO_CACHE_DIR=1

# Install runtime and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    tesseract-ocr \
    libglib2.0-0 \
    libgl1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

# Install heavy deps
RUN pip install --no-cache-dir --upgrade pip setuptools==69.5.1 wheel && \
    pip install --no-cache-dir numpy==1.26.4 scipy==1.12.0 && \
    pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir opencv-python-headless && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/
COPY processing_engine/ ./processing_engine/
COPY broken-463023-9245abcbef13.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/media /app/temp /app/event_analysis /root/.EasyOCR/model

# Pre-download EasyOCR models (ensure this runs in final image if possible, or copy from a stage)
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

CMD ["celery", "-A", "cricket_highlights", "worker", "--loglevel=info"]
