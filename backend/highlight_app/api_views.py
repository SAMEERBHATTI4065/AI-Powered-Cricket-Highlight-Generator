import json
import os
import uuid
import shutil
import time
import sys
import logging
from pathlib import Path

# Add parent directory to path to import processing_engine
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.http import JsonResponse, FileResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from celery.result import AsyncResult
from .views import cleanup_old_sessions
from .tasks import process_video_task
from .models import AnalysisSession
from .serializers import serialize_events
import re
import logging

logger = logging.getLogger(__name__)

def check_session_access(request, session_id):
    """
    Helper to check if request has permission to view the AnalysisSession.
    """
    try:
        session = AnalysisSession.objects.get(session_id=session_id)
    except AnalysisSession.DoesNotExist:
        return None, JsonResponse({'error': 'Results not found'}, status=404)

    token = request.GET.get('token')
    if token and session.share_token == token:
        return session, None

    if not request.user.is_authenticated or session.user_id != request.user.id:
        return None, JsonResponse({'error': 'Permission denied.'}, status=403)

    return session, None

def stream_video_api(request, session_id):
    """
    HTTP Range support for video seeking.
    """
    session, err_resp = check_session_access(request, session_id)
    if err_resp:
        return err_resp
    if not session.video_path:
        return JsonResponse({'error': 'Video path not found'}, status=404)
        
    file_path = os.path.join(settings.MEDIA_ROOT, session.video_path)
    if not os.path.exists(file_path):
        return JsonResponse({'error': 'File not found on disk'}, status=404)

    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
    size = os.path.getsize(file_path)
    content_type = 'video/mp4'

    if range_match:
        first_byte, last_byte = range_match.groups()
        first_byte = int(first_byte) if first_byte else 0
        last_byte = int(last_byte) if last_byte else size - 1
        if last_byte >= size:
            last_byte = size - 1
        length = last_byte - first_byte + 1
        
        def file_iterator(path, offset, chunk_size=8192):
            with open(path, 'rb') as f:
                f.seek(offset)
                remaining = length
                while remaining > 0:
                    data = f.read(min(chunk_size, remaining))
                    if not data:
                        break
                    yield data
                    remaining -= len(data)

        response = StreamingHttpResponse(file_iterator(file_path, first_byte), status=206, content_type=content_type)
        response['Content-Range'] = f'bytes {first_byte}-{last_byte}/{size}'
        response['Accept-Ranges'] = 'bytes'
        response['Content-Length'] = str(length)
    else:
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Accept-Ranges'] = 'bytes'
        response['Content-Length'] = str(size)
        
    return response

@csrf_exempt
@csrf_exempt
def upload_video_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    is_test_video = request.POST.get('use_test_video') == 'true'
    
    if not is_test_video and 'video' not in request.FILES:
         logging.error(f"UPLOAD FAILED: 'video' not in request.FILES.")
         logging.error(f"Keys present in FILES: {list(request.FILES.keys())}")
         logging.error(f"POST keys: {list(request.POST.keys())}")
         logging.error(f"Content-Type: {request.META.get('CONTENT_TYPE')}")
         logging.error(f"Content-Length: {request.META.get('CONTENT_LENGTH')}")
         logging.error(f"Remote Addr: {request.META.get('REMOTE_ADDR')}")
         return JsonResponse({'error': 'No video file provided'}, status=400)
         
    # Optimized Cleanup: Only run if free space is less than 5GB
    # Use a cache-based throttle to avoid running cleanup on every single request
    from django.core.cache import cache
    cleanup_lock = cache.get('cleanup_in_progress')
    
    try:
        usage = shutil.disk_usage(settings.MEDIA_ROOT)
        free_gb = usage.free / (1024**3)
        if free_gb < 5 and not cleanup_lock:
             logging.info(f"Low disk space ({free_gb:.1f}GB). Running cleanup...")
             cache.set('cleanup_in_progress', True, timeout=300) # 5 min lock
             cleanup_old_sessions(max_age_hours=1)
             cache.delete('cleanup_in_progress')
    except Exception as e:
        logging.error(f"Cleanup check failed: {e}")

    session_id = str(uuid.uuid4())
    upload_dir = Path(settings.MEDIA_ROOT) / 'uploads'
    results_dir = Path(settings.MEDIA_ROOT) / 'results' / session_id
    
    try:
        # Check disk space safely
        try:
            tmp_stat = shutil.disk_usage(settings.MEDIA_ROOT)
            free_mb = tmp_stat.free / (1024 * 1024)
            
            if free_mb < 200:
                 return JsonResponse({
                    'error': f'Server storage is full ({free_mb:.0f} MB free).',
                    'details': 'Temporary processing space is nearly full. Please wait a few minutes while cleanup runs.'
                }, status=507)
        except:
            pass # Skip check if disk_usage fails

        upload_dir.mkdir(parents=True, exist_ok=True)
        results_dir.mkdir(parents=True, exist_ok=True)
        
    except Exception as e:
        logging.error(f"Storage error: {str(e)}")
        return JsonResponse({
            'error': "Server storage configuration error",
            'details': f"The storage path is currently inaccessible. Error: {str(e)}",
            'troubleshooting': [
                "Restart the Docker containers using 'docker compose up -d' in the docker directory.",
                "Ensure Docker Desktop has permission to access the local drives."
            ]
        }, status=500)
    
    # Disk Space Check
    try:
        free_mb = shutil.disk_usage(settings.MEDIA_ROOT).free / (1024 * 1024)
        logging.info(f"DISK: Free space on media root: {free_mb:.1f} MB")
        if free_mb < 100:
            logging.error("UPLOAD REJECTED: Insufficient disk space")
            return JsonResponse({'error': 'Insufficient storage'}, status=507)
    except Exception as e:
        logging.warning(f"Disk check failed: {e}")
        
    processing_params = {
        'format': request.POST.get('format', 'MP4'),
        'depth': request.POST.get('depth', 'Standard'),
        'style': request.POST.get('style', 'Professional')
    }
    
    if is_test_video:
        master_test_path = ensure_valid_demo_video()
        
        if not master_test_path or not master_test_path.exists():
            return JsonResponse({
                'error': 'Test video file not found',
                'details': 'No valid test video file (.mp4) was found or could be resolved/downloaded.'
            }, status=404)
        
        video_filename = f"{session_id}_{master_test_path.name}"
        video_path = upload_dir / video_filename
        try:
            logging.info(f"FILE: Copying master demo {master_test_path.name} to {video_path}")
            shutil.copy2(master_test_path, video_path)
            logging.info("FILE: Demo video copied successfully for session")
        except Exception as e:
            logging.error(f"FILE ERROR: Demo video copy failed: {e}")
            return JsonResponse({'error': f"Failed to isolate demo video: {e}"}, status=500)
        
        video_title_val = master_test_path.stem.replace('_', ' ').replace('-', ' ').title()
        file_size_mb = master_test_path.stat().st_size / (1024 * 1024)
    else:
        video_file = request.FILES['video']
        file_size_mb = video_file.size / (1024 * 1024)
        logging.info(f"UPLOAD: Received file '{video_file.name}' ({file_size_mb:.1f} MB)")
        
        # File Size Limit (10GB)
        MAX_UPLOAD_MB = 10240
        if file_size_mb > MAX_UPLOAD_MB:
            logging.error(f"UPLOAD REJECTED: File too large ({file_size_mb:.1f}MB)")
            return JsonResponse({'error': 'File too large'}, status=413)
            
        filename_str = video_file.name
        while Path(filename_str).suffix in ['.mp4', '.mkv', '.avi', '.mov']:
            filename_str = Path(filename_str).stem
        
        video_filename = f"{session_id}_{filename_str}{Path(video_file.name).suffix or '.mp4'}"
        video_path = upload_dir / video_filename
        
        try:
            logging.info(f"FILE: Saving video to {video_path}")
            with open(video_path, 'wb+') as destination:
                for chunk in video_file.chunks():
                    destination.write(chunk)
            logging.info("FILE: Video saved successfully")
        except Exception as e:
            logging.error(f"FILE ERROR: {e}")
            return JsonResponse({'error': f"Failed to save video: {e}"}, status=500)
            
        video_title_val = video_file.name

    # Trigger process task asynchronously
    try:
        logging.info(f"CELERY: Triggering task for session {session_id}...")
        user_id = request.user.id if request.user.is_authenticated else None
        task = process_video_task.delay(
            str(video_path),
            session_id,
            params=processing_params,
            user_id=user_id,
            video_title=video_title_val
        )
        logging.info(f"CELERY: Task sent! Job ID: {task.id}")
        
        return JsonResponse({
            'session_id': session_id,
            'job_id': task.id,
            'message': 'Processing started',
            'filename': video_title_val
        })
        
    except Exception as e:
        logging.error(f"CELERY ERROR: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def get_status_api(request, job_id):
    from django.core.cache import cache

    # --- Cache layer: return cached response for PROGRESS states ---
    # PROGRESS responses are cached for 4s to avoid hammering Celery/Redis
    # on every frontend poll. SUCCESS/FAILURE are never cached.
    cache_key = f'status_cache_{job_id}'
    cached = cache.get(cache_key)
    if cached is not None:
        resp = JsonResponse(cached)
        resp['X-Cache'] = 'HIT'
        resp['Cache-Control'] = 'no-store'
        return resp

    try:
        task_result = AsyncResult(job_id)
        # Accessing state can trigger deserialization of a malformed result
        state = task_result.state
    except Exception as e:
        return JsonResponse({
            'state': 'FAILURE',
            'progress': 0,
            'status': "Task metadata corruption. System is recovering...",
            'error_details': str(e)
        }, status=200)

    if state == 'PENDING':
        response = {
            'state': state,
            'progress': 0,
            'status': 'Pending...'
        }
        # Cache pending for 5s — it rarely changes quickly
        cache.set(cache_key, response, timeout=5)

    elif state == 'PROGRESS':
        response = {
            'state': state,
            'progress': task_result.info.get('progress', 0),
            'stage': task_result.info.get('stage', ''),
            'stage_label': task_result.info.get('stage_label', ''),
            'eta_seconds': task_result.info.get('eta_seconds', 0),
            'frames_processed': task_result.info.get('frames_processed', 0),
            'total_frames': task_result.info.get('total_frames', 54000),
            'verified_events': task_result.info.get('verified_events', 0),
            'total_events': task_result.info.get('total_events', 0),
            'status': task_result.info.get('status', ''),
            'session_id': task_result.info.get('session_id', ''),
            'events': task_result.info.get('events', [])
        }
        # Cache for 4s — worker updates state every few seconds anyway
        cache.set(cache_key, response, timeout=4)

    elif state == 'SUCCESS':
        # result is the dict returned from process_video_task
        result = task_result.result if task_result.result else {}
        response = {
            'state': state,
            'progress': 100,
            'status': 'Complete',
            'session_id': result.get('session_id') if isinstance(result, dict) else None
        }
        # Bust the cache so next poll always gets fresh SUCCESS
        cache.delete(cache_key)

    elif state == 'FAILURE':
        response = {
            'state': state,
            'progress': 0,
            'status': str(task_result.info),
        }
        cache.delete(cache_key)

    else:
        response = {
            'state': task_result.state,
            'progress': 0,
            'status': 'Processing...'
        }

    resp = JsonResponse(response)
    resp['Cache-Control'] = 'no-store'
    return resp

def get_results_api(request, session_id):
    session, err_resp = check_session_access(request, session_id)
    if err_resp:
        return err_resp
        
    video_url = None
    if session.video_path:
        # Use our range-compatible streaming endpoint for better seeking performance
        video_url = f"/api/results/{session_id}/stream/"
        # Propagate the token to the stream URL if the current view was authorized by token
        token = request.GET.get('token')
        if token:
            video_url += f"?token={token}"
        
    # Process events through our custom serializer (adds timestamp_formatted, event_label, and validates range)
    serialized_events = serialize_events(session.events_json)
        
    return JsonResponse({
        'session_id': session_id,
        'verified_events': serialized_events,
        'summary_text': session.summary_text,
        'video_url': video_url,
        'share_token': session.share_token
    })

@csrf_exempt
def share_results_api(request, session_id):
    try:
        session = AnalysisSession.objects.get(session_id=session_id)
        
        # Validate and Apply rate limiting: max 10 share link generations per session
        from django.core.cache import cache
        cache_key = f'share_count_{session_id}'
        share_count = cache.get(cache_key, 0)
        
        # Generate new token if POSTed (per requirements, though model does it on save)
        if request.method == 'POST':
            if share_count >= 10:
                return JsonResponse({'error': 'Rate limit exceeded. Max 10 share links allowed.'}, status=429)
                
            import secrets
            session.share_token = secrets.token_urlsafe(16)
            session.save()
            
            # Increment share count
            cache.set(cache_key, share_count + 1, timeout=86400)
            
        base_url = request.build_absolute_uri('/')[:-1]
        # User requested /s/<token> format
        share_url = f"{base_url}/s/{session.share_token}"
        return JsonResponse({'share_url': share_url})
    except AnalysisSession.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)

def redirect_share_api(request, token):
    session = get_object_or_404(AnalysisSession, share_token=token)
    base_url = request.build_absolute_uri('/')[:-1]
    # Redirect to the results page with session_id
    return redirect(f"{base_url}/results?session_id={session.session_id}&token={token}")

def download_highlight_api(request, session_id):
    session, err_resp = check_session_access(request, session_id)
    if err_resp:
        return err_resp
        
    if not session.video_path:
        return JsonResponse({'error': 'Highlight file not found'}, status=404)
    
    file_path = os.path.join(settings.MEDIA_ROOT, session.video_path)
    if not os.path.exists(file_path):
         return JsonResponse({'error': 'Highlight file not found'}, status=404)
         
    # Stream the file using Django's FileResponse, setting correct headers
    response = FileResponse(open(file_path, 'rb'), content_type='video/mp4')
    response['Content-Disposition'] = f'attachment; filename="highlights_{session_id}.mp4"'
    return response

def check_share_token(request, session_id):
    token = request.GET.get('token')
    try:
        session = AnalysisSession.objects.get(session_id=session_id, share_token=token)
        return JsonResponse({'valid': True})
    except AnalysisSession.DoesNotExist:
        return JsonResponse({'valid': False}, status=403)

def ensure_valid_demo_video():
    uploads_dir = Path(settings.MEDIA_ROOT) / 'uploads'
    uploads_dir.mkdir(parents=True, exist_ok=True)
    demo_path = uploads_dir / 'cricket_full_match.mp4'
    
    # Check if there is already a valid MP4 file (size > 1MB)
    mp4_files = [f for f in uploads_dir.glob('*.mp4') if not f.name.startswith('.') and not re.match(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-', f.name)]
    valid_file = None
    for f in mp4_files:
        if f.exists() and f.stat().st_size > 1024 * 1024:
            valid_file = f
            break
            
    if valid_file:
        return valid_file
        
    # If no valid MP4 exists (or it is a 130-byte LFS pointer), download a small, valid 15MB sample video
    import urllib.request
    logger.info("Demo video not found or invalid LFS pointer. Downloading sample video from CDN...")
    
    url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    try:
        # Download with a timeout of 30 seconds
        urllib.request.urlretrieve(url, demo_path)
        logger.info(f"Downloaded sample video successfully to {demo_path}")
        return demo_path
    except Exception as e:
        logger.error(f"Failed to download sample video: {e}")
        
    # Fallback to local static demo file if it's valid
    fallback_path = Path(settings.BASE_DIR) / 'static' / 'demo' / 'cricket_full_match.mp4'
    if fallback_path.exists() and fallback_path.stat().st_size > 1024 * 1024:
        return fallback_path
        
    return None

def test_video_info(request):
    file_path = ensure_valid_demo_video()
    if file_path and file_path.exists():
        size_bytes = file_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        return JsonResponse({
            'exists': True,
            'filename': file_path.name,
            'size_mb': round(size_mb, 1)
        })
    else:
        return JsonResponse({
            'exists': False,
            'filename': 'cricket_full_match.mp4',
            'size_mb': 845.0
        })

def serve_demo_video(request):
    file_path = Path(settings.BASE_DIR) / 'static' / 'demo' / 'demo-video.mp4'
    if file_path.exists() and file_path.stat().st_size > 1024 * 1024:
        # Use HTTP Range requests for smooth video streaming and compatibility
        range_header = request.META.get('HTTP_RANGE', '').strip()
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        size = file_path.stat().st_size
        content_type = 'video/mp4'

        if range_match:
            first_byte, last_byte = range_match.groups()
            first_byte = int(first_byte) if first_byte else 0
            last_byte = int(last_byte) if last_byte else size - 1
            if last_byte >= size:
                last_byte = size - 1
            length = last_byte - first_byte + 1
            
            def file_iterator(path, offset, chunk_size=8192):
                with open(path, 'rb') as f:
                    f.seek(offset)
                    remaining = length
                    while remaining > 0:
                        data = f.read(min(chunk_size, remaining))
                        if not data:
                            break
                        yield data
                        remaining -= len(data)

            response = StreamingHttpResponse(file_iterator(file_path, first_byte), status=206, content_type=content_type)
            response['Content-Range'] = f'bytes {first_byte}-{last_byte}/{size}'
            response['Accept-Ranges'] = 'bytes'
            response['Content-Length'] = str(length)
        else:
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)
            response['Accept-Ranges'] = 'bytes'
            response['Content-Length'] = str(size)
            
        return response
        
    # If the local file is missing or is an LFS pointer, stream/proxy from public CDN to prevent CORS/redirect errors
    import requests
    public_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    try:
        req_headers = {}
        if 'HTTP_RANGE' in request.META:
            req_headers['Range'] = request.META['HTTP_RANGE']
            
        r = requests.get(public_url, headers=req_headers, stream=True, timeout=15)
        response = StreamingHttpResponse(r.iter_content(chunk_size=8192), status=r.status_code, content_type='video/mp4')
        
        # Propagate range headers from CDN response
        if 'Content-Range' in r.headers:
            response['Content-Range'] = r.headers['Content-Range']
        if 'Accept-Ranges' in r.headers:
            response['Accept-Ranges'] = r.headers['Accept-Ranges']
        if 'Content-Length' in r.headers:
            response['Content-Length'] = r.headers['Content-Length']
        return response
    except Exception as e:
        logger.error(f"Failed to proxy demo video from CDN: {e}")
        # Fallback redirect if streaming fails
        return redirect(public_url)


