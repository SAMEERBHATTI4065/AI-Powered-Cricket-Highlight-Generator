from pathlib import Path
from celery import shared_task
from django.conf import settings
from datetime import datetime
import time

@shared_task(bind=True)
def process_video_task(self, video_path, session_id, params=None):
    import os
    import shutil
    import cv2
    import json
    from .models import AnalysisSession
    from processing_engine.video_processor import generate_highlights
    
    def _tlog(msg, level="INFO"):
        ts = datetime.now().strftime("%H:%M:%S")
        icons = {"INFO": "📌", "STEP": "▶️", "OK": "✅", "WARN": "⚠️", "ERR": "❌",
                 "DATA": "📊", "FILE": "📁", "DB": "🗄️", "CLEAN": "🧹", "DONE": "🎉"}
        icon = icons.get(level, "📌")
        print(f"[{ts}] {icon} [CELERY] {msg}", flush=True)
    
    if params is None:
        params = {'format': 'MP4', 'depth': 'Standard', 'style': 'Professional'}
    
    # ── TASK START BANNER ──
    task_start = time.time()
    print(f"\n{'='*65}", flush=True)
    _tlog("CELERY TASK STARTED: process_video_task", "STEP")
    print(f"{'='*65}", flush=True)
    _tlog(f"Session ID : {session_id}")
    _tlog(f"Video path : {video_path}", "FILE")
    _tlog(f"Parameters : {params}", "DATA")
    
    # Define paths
    sessions_root = Path(settings.MEDIA_ROOT) / 'cricket_sessions'
    sessions_root.mkdir(parents=True, exist_ok=True)
    
    # Use MEDIA_ROOT for processing results
    results_dir = Path(settings.MEDIA_ROOT) / 'cricket_results' / session_id
    results_dir.mkdir(parents=True, exist_ok=True)
    _tlog(f"Results dir: {results_dir.absolute()}", "FILE")
    
    try:
        _tlog("Validating video file integrity...", "STEP")
        self.update_state(state='PROGRESS', meta={
            'progress': 5, 'stage': 'file_read', 'stage_label': 'File Read',
            'status': 'Validating video integrity...'
        })
        
        if not os.path.exists(video_path):
            _tlog(f"Video file NOT found at: {video_path}", "ERR")
            raise Exception(f"Video file not found at {video_path}")
        
        file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
        _tlog(f"Video file found: {file_size_mb:.2f} MB", "OK")
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            _tlog("Cannot open video stream — file may be corrupt!", "ERR")
            raise Exception("File Integrity Check Failed: Cannot open video stream. The file may be corrupt.")
        
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = frame_count / fps if fps > 0 else 0
        cap.release()
        _tlog(f"Video validated: {frame_count:,} frames, {fps:.1f} FPS, {duration:.1f}s duration", "OK")
        # Callback for progress updates
        def prog_cb(pct, stage_lbl, status_msg, verified_count=0, total_events=0, current_events=None):
            self.update_state(state='PROGRESS', meta={
                'progress': pct, 
                'stage': 'processing', 
                'stage_label': stage_lbl,
                'status': status_msg,
                'verified_events': verified_count,
                'total_events': total_events,
                'events': current_events or [],
                'session_id': session_id
            })

        # Actual processing call
        _tlog("Calling generate_highlights() — main processing pipeline...", "STEP")
        # Call generate_highlights with progress callback and explicit output_dir
        result_data = generate_highlights(video_path, output_dir=str(results_dir), progress_callback=prog_cb)
        
        if not result_data.get('success'):
            _tlog(f"Processing failed: {result_data.get('error', 'Unknown')}", "ERR")
            raise Exception(result_data.get('error', 'Unknown processing error'))
        
        _tlog("Processing completed successfully!", "OK")

        # Prepare database record
        _tlog("Reading generated data for database storage...", "DB")
        verified_events = result_data.get('verified_events', [])
        
        summary_text = ""
        summary_path = results_dir / 'Final_summary.txt'
        
        if summary_path.exists():
            with open(summary_path, 'r', encoding='utf-8') as f:
                summary_text = f.read().strip()
            _tlog(f"Loaded summary from file: {len(summary_text)} chars", "DATA")
        
        if not summary_text:
            summary_text = "The match analysis is complete. We've identified all key milestones including boundaries and wickets. You can review each event in the timeline to see the specific action captured by our AI engine."
            _tlog("Using fallback summary", "WARN")

        # Handle highlight video
        output_video_path = result_data.get('output_video')
        final_video_name = f"highlights_{session_id}.mp4"
        final_video_dest = sessions_root / final_video_name
        
        if output_video_path and os.path.exists(output_video_path):
            shutil.move(output_video_path, str(final_video_dest))
            _tlog(f"Stored final highlights: {final_video_name}", "FILE")

        # Save to DB
        _tlog("Saving results to database...", "DB")
        session, created = AnalysisSession.objects.get_or_create(session_id=session_id)
        session.summary_text = summary_text
        session.events_json = verified_events
        session.video_path = f"cricket_sessions/{final_video_name}"
        session.save()
        _tlog(f"Database record updated for session: {session_id}", "OK")

        # CLEANUP: Remove session temp folder (event_analysis, clips, etc)
        _tlog("Cleaning up temporary processing files...", "CLEAN")
        shutil.rmtree(results_dir, ignore_errors=True)
        _tlog(f"Removed temp directory: {results_dir}", "CLEAN")
        
        # Also cleanup the original upload unconditionally to free space immediately
        try:
            os.remove(video_path)
            _tlog(f"Removed uploaded video: {video_path}", "CLEAN")
        except:
            _tlog(f"Could not remove uploaded video (may already be gone)", "WARN")

        task_time = time.time() - task_start
        print(f"\n{'='*65}", flush=True)
        _tlog(f"CELERY TASK COMPLETE in {task_time:.1f}s ({task_time/60:.1f} min)", "DONE")
        _tlog(f"Session: {session_id}", "DATA")
        _tlog(f"Events: {len(verified_events)}, Video: {final_video_name}", "DATA")
        print(f"{'='*65}\n", flush=True)

        # Update Celery progress to 100% before finishing
        self.update_state(state='PROGRESS', meta={
            'progress': 100,
            'stage': 'finalizing',
            'stage_label': 'Finalizing',
            'status': 'Completed and saving results'
        })
        return {
            'progress': 100,
            'status': 'complete',
            'session_id': session_id
        }
        
    except Exception as e:
        _tlog(f"TASK FAILED: {e}", "ERR")
        raise e
