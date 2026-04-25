# Highlight App - Django Application

## Responsibility

The `highlight_app` is the main Django application that implements the business logic for cricket highlight generation.

## Purpose

- **API Endpoints**: Define REST API views for video upload, status checking, and result retrieval
- **Data Models**: Define database schema for videos, events, highlights, and summaries
- **Serializers**: Handle JSON serialization/deserialization for API requests/responses
- **Celery Tasks**: Define asynchronous tasks that interface with the processing_engine
- **Business Logic**: Coordinate between API requests and processing engine execution

## Key Components

### `models.py`
Database models:
- `MatchVideo` - Uploaded video metadata
- `DetectedEvent` - Individual cricket events (boundary, wicket)
- `Highlight` - Generated highlight clips
- `Summary` - AI-generated match summaries

### `serializers.py`
DRF serializers for:
- Video upload validation
- Event data formatting
- Highlight metadata
- Summary responses

### `views.py`
API views:
- Video upload endpoint
- Processing status endpoint
- Highlight retrieval endpoint
- Summary retrieval endpoint

### `tasks.py`
Celery tasks:
- `process_video_task` - Trigger video_processor.py
- `generate_summary_task` - Trigger summary_generator.py
- `cleanup_temp_files_task` - Maintenance tasks

### `urls.py`
URL routing for all API endpoints

### `utils.py`
Helper functions:
- File validation
- Path management
- Status tracking

## Workflow

1. User uploads video via API → `views.py`
2. Video saved to database → `models.py`
3. Celery task triggered → `tasks.py`
4. Processing engine invoked → `processing_engine/video_processor.py`
5. Results stored in database → `models.py`
6. User retrieves results via API → `views.py`

## Development

(Setup instructions will be added in Phase 1)
