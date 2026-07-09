# Backend - Django REST API

## Responsibility

The backend serves as the REST API layer for the Cricket Highlight Project. It handles:

- **Video Upload Management**: Accepting and storing user-uploaded cricket match videos
- **Job Orchestration**: Triggering and managing video processing tasks via Celery
- **Status Tracking**: Monitoring processing progress and job states
- **Result Delivery**: Serving generated highlights and summaries to clients
- **Database Management**: Storing metadata, processing results, and event information

## Structure

```
backend/
├── manage.py                    # Django management script
├── config/                      # Project settings
│   ├── __init__.py
│   ├── settings.py             # Django settings
│   ├── urls.py                 # Root URL configuration
│   ├── wsgi.py                 # WSGI entry point
│   └── celery.py               # Celery configuration
├── highlight_app/              # Main application
│   ├── migrations/             # Database migrations
│   ├── models.py               # Data models
│   ├── serializers.py          # DRF serializers
│   ├── views.py                # API views
│   ├── urls.py                 # App URL routing
│   ├── tasks.py                # Celery tasks
│   └── utils.py                # Helper functions
└── requirements.txt            # Python dependencies
```

## Technology

- **Django 4.x**: Web framework
- **Django REST Framework**: API development
- **Celery**: Asynchronous task processing
- **PostgreSQL**: Primary database (production)
- **SQLite**: Development database

## API Endpoints (Planned)

- `POST /api/videos/upload/` - Upload cricket match video
- `GET /api/videos/{id}/status/` - Check processing status
- `GET /api/videos/{id}/highlights/` - Retrieve generated highlights
- `GET /api/videos/{id}/summary/` - Retrieve AI-generated summary
- `GET /api/videos/{id}/events/` - Get detected events

## Development Setup

(Instructions will be added in Phase 1)

## Environment Variables

(Configuration details will be added in Phase 1)
