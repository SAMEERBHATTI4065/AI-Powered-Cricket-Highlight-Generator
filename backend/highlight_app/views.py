"""
Django views for Cricket Highlights application.

This module integrates the existing processing_engine modules WITHOUT modifying their logic.
"""

import os
import sys
import json
import uuid
import shutil
import time
from pathlib import Path

from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage

from .forms import VideoUploadForm


def upload_view(request):
    """
    Display video upload form.
    """
    form = VideoUploadForm()
    return render(request, 'highlight_app/upload.html', {'form': form})


def cleanup_old_sessions(max_age_hours=1):
    """
    Delete session results older than max_age_hours to free disk space.
    """
    results_base = Path(settings.MEDIA_ROOT) / 'results'
    if not results_base.exists():
        return
    
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for session_dir in results_base.iterdir():
        if session_dir.is_dir():
            # Check directory age
            dir_age = current_time - session_dir.stat().st_mtime
            if dir_age > max_age_seconds:
                try:
                    shutil.rmtree(session_dir)
                    print(f"🗑️ Cleaned up old session: {session_dir.name}")
                except Exception as e:
                    print(f"⚠️ Failed to cleanup {session_dir.name}: {e}")
    
    # --- ALSO CLEANUP /app/temp for Railway/Monolith sharing ---
    temp_paths = [Path('/app/temp/cricket_results'), Path('/app/temp/cricket_uploads')]
    for temp_base in temp_paths:
        if temp_base.exists():
            for item in temp_base.iterdir():
                if item.stat().st_mtime < (current_time - max_age_seconds):
                    try:
                        if item.is_dir():
                            shutil.rmtree(item)
                        else:
                            os.remove(item)
                        print(f"🧹 Cleaned up temp item: {item.name}")
                    except Exception as e:
                        print(f"⚠️ Failed to cleanup temp item {item.name}: {e}")


def process_view(request):
    """
    Handle video upload and processing.
    Calls generate_highlights() and generate_summary() from processing_engine.
    """
    if request.method != 'POST':
        return redirect('upload')
    
    form = VideoUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        return render(request, 'highlight_app/upload.html', {'form': form})
    
    # Cleanup old sessions before processing new video
    print("🧹 Cleaning up old sessions...")
    cleanup_old_sessions(max_age_hours=24)
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Create directories
    upload_dir = Path(settings.MEDIA_ROOT) / 'uploads'
    results_dir = Path(settings.MEDIA_ROOT) / 'results' / session_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # Save uploaded video
    video_file = request.FILES['video_file']
    video_filename = f"{session_id}_{video_file.name}"
    video_path = upload_dir / video_filename
    
    with open(video_path, 'wb+') as destination:
        for chunk in video_file.chunks():
            destination.write(chunk)
    
    # Store session info in request session
    request.session['session_id'] = session_id
    request.session['video_filename'] = video_file.name
    
    print(f"\n{'='*60}")
    print(f"🎬 STARTING VIDEO PROCESSING")
    print(f"{'='*60}")
    print(f"Session ID: {session_id}")
    print(f"Video file: {video_file.name}")
    print(f"Video size: {video_file.size / (1024*1024):.2f} MB")
    print(f"Upload path: {video_path}")
    print(f"Results dir: {results_dir}")
    print(f"{'='*60}\n")
    
    # Change to results directory (required by original code)
    original_cwd = os.getcwd()
    os.chdir(results_dir)
    
    print(f"✅ Changed working directory to: {os.getcwd()}")
    
    try:
        # NOTE: Direct processing is disabled in favor of Celery tasks.
        # This view is legacy and should not be used for heavy processing.
        return render(request, 'highlight_app/upload.html', {
            'form': form, 
            'error': "Direct processing is disabled. Please use the Dashboard for AI Analysis."
        })
        
    except Exception as e:
        print(f"\n❌ ERROR during processing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Restore original working directory
        os.chdir(original_cwd)
        print(f"\n✅ Restored working directory to: {os.getcwd()}")
    
    print(f"\n{'='*60}")
    print(f"🎉 PROCESSING COMPLETE - Redirecting to results")
    print(f"{'='*60}\n")
    
    # Redirect to results page
    return redirect('result', session_id=session_id)


def result_view(request, session_id):
    """
    Display processing results: video, summary, and events.
    """
    results_dir = Path(settings.MEDIA_ROOT) / 'results' / session_id
    event_analysis_dir = results_dir / 'event_analysis'

    # Check if results exist
    if not results_dir.exists():
        return HttpResponse("Results not found. Please upload and process a video first.", status=404)

    # Read verified events JSON
    verified_events = []
    json_path = event_analysis_dir / 'verified_events.json'
    if json_path.exists():
        with open(json_path, 'r') as f:
            verified_events = json.load(f)

    # Read summary text
    summary_text = None
    summary_path = event_analysis_dir / 'Final_summary.txt'
    if summary_path.exists():
        with open(summary_path, 'r', encoding='utf-8') as f:
            summary_text = f.read()

    # Check for final highlights video
    video_path = results_dir / 'final_highlights.mp4'
    video_url = None
    if video_path.exists():
        video_url = f"{settings.MEDIA_URL}results/{session_id}/final_highlights.mp4"

    # Get original filename from session
    original_filename = request.session.get('video_filename', 'Unknown')

    context = {
        'session_id': session_id,
        'verified_events': verified_events,
        'summary_text': summary_text,
        'video_url': video_url,
        'original_filename': original_filename,
        'total_events': len(verified_events),
    }

    return render(request, 'highlight_app/result.html', context)


def logs_list_view(request):
    """
    List all available log files from /app/logs directory.
    Accessible at /logs/ — provides plain-text index of log files.
    """
    from django.http import Http404
    logs_dir = Path('/app/logs')
    if not logs_dir.exists():
        # Fallback to MEDIA_ROOT sibling
        logs_dir = Path(settings.MEDIA_ROOT).parent / 'logs'
    if not logs_dir.is_dir():
        raise Http404("Logs directory not found.")

    files = sorted(logs_dir.iterdir())
    index_lines = [f"=== Log files in {logs_dir} ===\n"]
    for f in files:
        if f.is_file():
            size_kb = f.stat().st_size / 1024
            index_lines.append(f"  {f.name}  ({size_kb:.1f} KB)  -> /logs/{f.name}/")
    return HttpResponse("\n".join(index_lines), content_type='text/plain')


def logs_view(request, file_path):
    """
    Serve a single log file from /app/logs directory.
    Reads the last 200 KB of the file and returns it as plain text.
    URL pattern: /logs/<file_path>/
    """
    from django.http import Http404
    logs_dir = Path('/app/logs')
    if not logs_dir.exists():
        logs_dir = Path(settings.MEDIA_ROOT).parent / 'logs'
    file_full_path = logs_dir / file_path
    if not file_full_path.exists() or not file_full_path.is_file():
        raise Http404(f"Log file '{file_path}' not found.")
    try:
        with open(file_full_path, 'rb') as f:
            # Tail last 200 KB
            f.seek(0, 2)
            size = f.tell()
            start = max(0, size - 200 * 1024)
            f.seek(start)
            data = f.read().decode('utf-8', errors='replace')
        prefix = f"=== {file_path} (last {min(200, size//1024)} KB) ===\n\n" if size > 0 else f"=== {file_path} (empty) ===\n"
        return HttpResponse(prefix + data, content_type='text/plain; charset=utf-8')
    except Exception as e:
        return HttpResponse(f"Error reading log file: {e}", status=500, content_type='text/plain')
