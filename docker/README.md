# Docker Configuration

## Responsibility

This directory contains all Docker-related configuration for containerized deployment of the Cricket Highlight Project.

## Architecture

The application uses a multi-container architecture:

### Services

1. **backend** (Django API)
   - Serves REST API endpoints
   - Handles HTTP requests
   - Manages database operations
   - Built from: `backend.Dockerfile`

2. **worker** (Celery Worker)
   - Processes video analysis tasks
   - Runs heavy computational workloads
   - Executes processing_engine modules
   - Built from: `worker.Dockerfile`

3. **redis** (Message Broker)
   - Celery task queue
   - Result backend
   - Official Redis image

4. **db** (PostgreSQL)
   - Primary database
   - Persistent storage
   - Official PostgreSQL image

## Files

### `docker-compose.yml`
Orchestrates all services with:
- Service definitions
- Network configuration
- Volume mounts
- Environment variables
- Port mappings

### `backend.Dockerfile`
Django API container:
- Python 3.11 base image
- Django dependencies
- Gunicorn WSGI server
- Exposes port 8000

### `worker.Dockerfile`
Celery worker container:
- Python 3.11 base image
- Processing dependencies (FFmpeg, Tesseract, OpenCV)
- Celery worker configuration
- Shared volumes with backend

## Volumes

- `media_data` - User uploads and generated content
- `postgres_data` - Database persistence
- `logs_data` - Application logs
- `temp_data` - Temporary processing files

## Networks

- `app_network` - Internal communication between services

## Usage

(Commands will be added in Phase 4)

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Environment Variables

(Configuration details will be added in Phase 4)
