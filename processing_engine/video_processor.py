import librosa
import numpy as np
import os
import subprocess
import glob
import cv2
import re
import easyocr
import shutil
import json
import sys
import io
import logging
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    filename="processing.log",
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    encoding="utf-8",
)

# Suppress noisy library logs
logging.getLogger("easyocr").setLevel(logging.ERROR)

# Fix encoding for Windows console
if hasattr(sys.stdout, "buffer"):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    except (AttributeError, io.UnsupportedOperation):
        pass

# Import summary generator
try:
    try:
        from . import summary_generator
    except (ImportError, ValueError):
        from processing_engine import summary_generator
except ImportError:
    import summary_generator

# EasyOCR Reader (global, initialize once)
reader = None


def _log(msg, level="INFO", indent=0):
    ts = datetime.now().strftime("%H:%M:%S")
    prefix = "  " * indent
    icons = {
        "INFO": "📌",
        "STEP": "▶️ ",
        "OK": "✅",
        "WARN": "⚠️ ",
        "ERR": "❌",
        "DATA": "📊",
        "FILE": "📁",
        "READ": "📖",
        "OCR": "🔍",
        "CUT": "✂️ ",
        "MERGE": "🔗",
        "AI": "🤖",
        "DONE": "🎉",
        "TIME": "⏱️ ",
    }
    icon = icons.get(level, "📌")
    print(f"[{ts}] {icon} {prefix}{msg}", flush=True)


def get_reader():
    global reader
    if reader is None:
        _log("Initializing EasyOCR...", "AI")
        import gc

        gc.collect()  # Force cleanup before loading heavy AI models
        reader = easyocr.Reader(["en"], gpu=False)
    return reader


# IMPROVEMENT 6: BETTER clean_scoreboard_text()
# - Handles dot-format overs (8.3) directly
# - Extra fallback parsing layer (finds overs even without "P" token)
def clean_scoreboard_text(ocr_text):
    text = (
        ocr_text.replace("/", " ")
        .replace("|", " ")
        .replace(",", " ")
        .replace("[", " ")
        .replace("]", " ")
    )
    tokens = text.split()

    logging.debug(f"Cleaning text: {ocr_text} -> Tokens: {tokens}")

    team = None
    score = None
    overs = None
    total_overs = None

    # --- Team name ---
    # We look for all uppercase tokens and pick the one most likely to be the active team
    # (usually first or near the score)
    candidate_teams = [
        t for t in tokens if t.isalpha() and t.isupper() and 2 <= len(t) <= 4
    ]
    if candidate_teams:
        team = candidate_teams[0]  # Default to first one
        # If there are multiple, and one is 'P' or other noise, we skip it
        for ct in candidate_teams:
            if ct not in ["P", "O", "V", "I", "II"]:
                team = ct
                break

    # --- Score (e.g. 123-4) ---
    m = re.search(r"\d+\s*-\s*\d+", text)
    if m:
        score = m.group().replace(" ", "")

    # --- Overs: Primary — look for "P" token ---
    for i, t in enumerate(tokens):
        if t.lower() == "p" and i + 1 < len(tokens):
            nxt = tokens[i + 1]

            # Already has dot: "8.3"
            if "." in nxt and nxt.replace(".", "").isdigit():
                overs = nxt
                if i + 2 < len(tokens) and tokens[i + 2].isdigit():
                    total_overs = tokens[i + 2]

            # No dot, 2+ digits: "42" → "4.2", "421" → "42.1"
            elif nxt.isdigit() and len(nxt) >= 2:
                over_val = nxt[:-1]
                ball_val = nxt[-1]
                # Ball must be 0-5
                if int(ball_val) <= 5:
                    overs = f"{over_val}.{ball_val}"
                else:
                    overs = f"{nxt}.0"
                
                if i + 2 < len(tokens) and tokens[i + 2].isdigit():
                    total_overs = tokens[i + 2]
                elif len(nxt) >= 4 and not overs.endswith(".0"):
                    total_overs = nxt[2:]

            # Single digit: "4" 
            elif nxt.isdigit() and len(nxt) == 1:
                # Check if next token is ball: ["P", "4", "2"]
                if i + 2 < len(tokens) and tokens[i + 2].isdigit() and len(tokens[i + 2]) == 1 and int(tokens[i+2]) <= 5:
                    overs = f"{nxt}.{tokens[i+2]}"
                    if i + 3 < len(tokens) and tokens[i + 3].isdigit():
                        total_overs = tokens[i + 3]
                else:
                    overs = f"{nxt}.0"
                    if i + 2 < len(tokens) and tokens[i + 2].isdigit():
                        total_overs = tokens[i + 2]
            break

    # --- Overs: Fallback 1 — explicit decimal like "7.5" ---
    if not overs:
        for i, t in enumerate(tokens):
            if "." in t and t.replace(".", "").isdigit():
                overs = t
                if i + 1 < len(tokens) and tokens[i + 1] in ["20", "50", "100"]:
                    total_overs = tokens[i + 1]
                break

    # --- Overs: Fallback 2 — "75 20" where OCR missed the dot ---
    if not overs:
        for i, t in enumerate(tokens):
            if (
                t.isdigit()
                and i + 1 < len(tokens)
                and tokens[i + 1] in ["20", "50", "100"]
            ):
                if len(t) == 1:
                    overs = f"{t}.0"
                elif len(t) == 2:
                    overs = f"{t[0]}.{t[1]}"
                elif len(t) >= 3:
                    overs = f"{t[:-1]}.{t[-1]}"
                total_overs = tokens[i + 1]
                break

    # --- Match Result ---
    match_result = None
    for res_kw in ["WON", "WINS", "VICTORY", "WON BY", "WINNER"]:
        if res_kw in text.upper():
            # Try to grab the whole line or a chunk around the keyword
            match_result = text.strip()
            break

    result = {
        "team": team,
        "score": score,
        "overs": overs,
        "total_overs": total_overs,
        "match_result": match_result,
    }

    if team and score and overs and total_overs:
        result["formatted"] = f"{team} {score} P {overs}/{total_overs}"
    elif team and score:
        result["formatted"] = f"{team} {score}"
    else:
        result["formatted"] = ocr_text

    return result


# OCR SCORE EXTRACTION
def get_score_from_image_ai(img_path, is_verified=False):
    ocr_reader = get_reader()
    img = cv2.imread(img_path)
    if img is None:
        logging.error(f"Could not read image: {img_path}")
        return None

    img_res = cv2.resize(img, None, fx=1.3, fy=1.3, interpolation=cv2.INTER_LINEAR)
    results = ocr_reader.readtext(img_res)
    full_text = " ".join([text for (_, text, _) in results])
    confidence = np.mean([c for (_, _, c) in results]) if results else 0.0

    clean_text = None
    if is_verified:
        clean_text = clean_scoreboard_text(full_text)
        print(f"    [CLEANED DATA]: {clean_text}")
        logging.info(f"[CLEANED DATA]: {clean_text}")
    else:
        print(f"    [AI RAW DATA]: {full_text}")
        logging.debug(f"[AI RAW DATA]: {full_text}")

    # Robust regex for score-wicket pair
    match = re.search(r"(\d+)\s*[\-\/\[\|]\s*(\d+)", full_text)
    if match:
        return {
            "score": int(match.group(1)),
            "wicket": int(match.group(2)),
            "team": clean_text.get("team") if isinstance(clean_text, dict) else None,
            "match_result": (
                clean_text.get("match_result") if isinstance(clean_text, dict) else None
            ),
            "clean_text": (
                clean_text.get("formatted")
                if isinstance(clean_text, dict)
                else clean_text
            ),
            "confidence": confidence,
        }

    nums = re.findall(r"\d+", full_text)
    if nums:
        # Fallback: take first as score, second as wicket if it's small
        score_val = int(nums[0])
        wicket_val = None
        if len(nums) > 1:
            try:
                w = int(nums[1])
                if 0 <= w <= 10:
                    wicket_val = w
            except:
                pass

        return {
            "score": score_val,
            "wicket": wicket_val,
            "team": clean_text.get("team") if isinstance(clean_text, dict) else None,
            "match_result": (
                clean_text.get("match_result") if isinstance(clean_text, dict) else None
            ),
            "clean_text": (
                clean_text.get("formatted")
                if isinstance(clean_text, dict)
                else clean_text
            ),
            "confidence": confidence * 0.7,
        }

    return None



# SMART VALIDATION: CRICKET CONTEXT CHECK
def validate_video_context(cap, duration, sample_points=[60, 90, 120, 180, 240, 300]):
    """
    Checks if the video actually contains a cricket scoreboard and if it's already a highlight.
    Returns (is_valid, message)
    """
    _log("Phase 0: Smart Validation (Cricket Context Check)... bypassed per user request.", "STEP")
    return True, "Success"


# CAPTURE SCOREBOARD
# Uses a shared VideoCapture object (IMPROVEMENT 5 — reuse cap)
def capture_scoreboard_full_width(cap, timestamp, output_path):
    """
    cap       : shared cv2.VideoCapture object
    timestamp : absolute second in the ORIGINAL video
    """
    if not cap.isOpened():
        return False

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(fps * timestamp))
    ret, frame = cap.read()

    if ret:
        h, w = frame.shape[:2]
        roi_top = int(h * 0.90)  # bottom 10% — scoreboard strip
        crop = frame[roi_top:h, 0:w]
        cv2.imwrite(output_path, crop)
        return True
    return False


# IMPROVEMENT 8: get_video_duration() using ffprobe
def get_video_duration(video_path):
    try:
        cmd = f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{video_path}"'
        output = subprocess.check_output(cmd, shell=True).decode().strip()
        return float(output)
    except Exception:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        cap.release()
        if fps > 0:
            return frames / fps
        return 0


# AUDIO EVENT DETECTION
# IMPROVEMENT 1: Rolling 30-min window mean (instead of one global mean)
def detect_events(y, sr, min_gap_sec=35):
    """
    Uses a rolling 30-minute window to compute local mean energy.
    Threshold = local_mean * 3.5  (same multiplier as original code 1)
    This avoids missing quiet-phase events and drowning in loud-phase noise.
    """
    _log("Audio analysis — Rolling 30-min adaptive threshold...", "DATA")

    energy = librosa.feature.rms(y=y)[0]
    t = librosa.frames_to_time(range(len(energy)), sr=sr)

    # Rolling window = 30 minutes worth of RMS frames
    fps_rms = sr / 512  # default hop_length=512
    window_size = int(fps_rms * 1800)  # 30 minutes
    if window_size < 1:
        window_size = 1

    rolling_mean = np.convolve(energy, np.ones(window_size) / window_size, mode="same")
    thresholds = rolling_mean * 3.6  # same multiplier as original

    peaks = []
    for i in range(1, len(energy) - 1):
        if energy[i] > thresholds[i] and energy[i] > energy[i - 1]:
            peaks.append(t[i])

    final_ts = []
    if peaks:
        final_ts.append(peaks[0])
        for p in peaks[1:]:
            if p - final_ts[-1] > min_gap_sec:
                final_ts.append(p)

    _log(f"Events after {min_gap_sec}s gap filter: {len(final_ts)}", "OK")
    _log(f"Timestamps: {[f'{x:.1f}s' for x in final_ts]}", "DATA")
    return final_ts


# MAIN PIPELINE
# IMPROVEMENT 2: Chunked processing (30-min chunks)
# IMPROVEMENT 4: output_dir support
# IMPROVEMENT 7: progress_callback support
def generate_highlights(
    videos=None, output_dir=None, progress_callback=None, max_process_minutes=None
):
    """
    max_process_minutes : int | float | None
        Kitne minutes tak video process karni hai.
        None dene par poori video process hogi.
        Default = 60 minutes.
        Example: max_process_minutes=30  → sirf pehle 30 min
                 max_process_minutes=90  → 90 min tak
                 max_process_minutes=None → poori video
    """
    if progress_callback:
        progress_callback(10, "initialization", "Starting video processing...")

    # --- FFmpeg check ---
    if not shutil.which("ffmpeg"):
        logging.error("FFmpeg not found in system PATH.")
        print("❌ CRITICAL ERROR: FFmpeg is not installed or not in PATH.")
        return {
            "success": False,
            "error": "FFmpeg is missing. Please install FFmpeg to process videos.",
        }

    # --- Resolve video path ---
    video_path = videos
    if video_path is None:
        video_folder = os.path.join("data", "videos")
        video_files = glob.glob(os.path.join(video_folder, "*.mp4"))
        if not video_files:
            print("❌ Video nahi mili!")
            return {"success": False, "error": "No video found."}
        video_path = video_files[0]

    video_path = os.path.abspath(video_path)
    output_base = output_dir if output_dir else "event_analysis"

    # Fresh output folder
    if os.path.exists(output_base):
        shutil.rmtree(output_base, ignore_errors=True)
    os.makedirs(output_base, exist_ok=True)

    print(f"🚀 Processing: {video_path}")

    # --- Get duration ---
    duration = get_video_duration(video_path)
    if duration == 0:
        print("⚠️ Could not determine video length. Assuming 30 minutes.")
        duration = 1800

    print(f"🎞️ Total Duration: {duration / 60:.2f} minutes")

    # SMART VALIDATION: Check Context & Duration
    temp_cap = cv2.VideoCapture(video_path)
    is_valid, msg = validate_video_context(temp_cap, duration)
    temp_cap.release()

    if not is_valid:
        print(f"❌ VALIDATION FAILED: {msg}")
        return {"success": False, "error": msg}

    # --- Determine how much to process ---
    if max_process_minutes is None:
        max_duration = duration  # poori video
        print(f"📌 Processing FULL video ({duration/60:.2f} min).")
    else:
        max_duration = min(duration, max_process_minutes * 60)
        print(
            f"📌 Processing limited to {max_process_minutes} minutes "
            f"({max_duration/60:.2f} min of {duration/60:.2f} min total)."
        )
        if max_duration < duration:
            print(
                f"⚠️  Remaining {(duration - max_duration)/60:.2f} min will be skipped."
            )

    # --- Build 30-min chunks ---
    chunks = []
    chunk_start = 0
    while chunk_start < max_duration:
        chunk_dur = min(1800, max_duration - chunk_start)
        chunks.append((chunk_start, chunk_dur))
        chunk_start += chunk_dur

    print(f"✂️ Processing in {len(chunks)} chunk(s) of ≤30 minutes each.")

    # SHARED VideoCapture  (IMPROVEMENT 5)
    shared_cap = cv2.VideoCapture(video_path)
    if not shared_cap.isOpened():
        return {"success": False, "error": f"Cannot open video: {video_path}"}

    all_verified_events = []
    all_verified_clips_paths = []
    verified_score_transitions = set()  # (prev_score, curr_score, wicket_change)
    last_clip_end_time = -999.0  # end time of last verified clip

    # PHASE 1: PRE-SCAN (DETECT ALL CANDIDATE EVENTS)
    all_candidate_abs_timestamps = []
    _log("PHASE 1: Detecting all candidate events across all chunks (PARALLEL)...", "STEP")

    from concurrent.futures import ThreadPoolExecutor, as_completed

    def _scan_chunk_internal(chunk_info):
        chunk_idx, (c_start, c_duration) = chunk_info
        chunk_num = chunk_idx + 1
        temp_audio = os.path.join(output_base, f"temp_audio_c{chunk_num}.wav")
        candidates = []
        try:
            # Input seeking (-ss before -i) is fast
            subprocess.check_call(
                f'ffmpeg -ss {c_start} -t {c_duration} -i "{video_path}" '
                f'-ac 1 -ar 8000 -vn "{temp_audio}" -y -loglevel error',
                shell=True,
            )
            if os.path.exists(temp_audio):
                # Use librosa to load the extracted audio
                y, sr = librosa.load(temp_audio, sr=None)
                os.remove(temp_audio)
                chunk_candidates_rel = detect_events(y, sr, min_gap_sec=40)
                for ts_rel in chunk_candidates_rel:
                    candidates.append(c_start + ts_rel)
        except Exception as e:
            logging.error(f"Scan failed for chunk {chunk_num}: {e}")
            if os.path.exists(temp_audio):
                os.remove(temp_audio)
        return chunk_num, candidates

    # Determine number of workers (max 4 to avoid memory spikes on Hugging Face)
    max_workers = min(len(chunks), 4)
    completed_chunks = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {executor.submit(_scan_chunk_internal, (i, chunk)): i for i, chunk in enumerate(chunks)}
        
        for future in as_completed(future_to_chunk):
            chunk_num, chunk_candidates = future.result()
            all_candidate_abs_timestamps.extend(chunk_candidates)
            completed_chunks += 1
            
            if progress_callback:
                scan_pct = 10 + (completed_chunks / len(chunks) * 15)
                progress_callback(
                    int(scan_pct),
                    "event_detection",
                    f"Audio scanning: Chunk {completed_chunks}/{len(chunks)} complete",
                )
            
            print(f"✅ Chunk {chunk_num} scan complete. Found {len(chunk_candidates)} candidates.")

    # Sort timestamps as they might come out of order from parallel execution
    all_candidate_abs_timestamps.sort()
    total_video_candidates = len(all_candidate_abs_timestamps)
    print(
        f"\n✅ PHASE 1 COMPLETE: Found {total_video_candidates} candidate events in total."
    )

    # PHASE 2: VERIFICATION & CLIPPING
    _log("PHASE 2: Verifying events and cutting clips...", "STEP")

    for ev_idx, abs_ts in enumerate(all_candidate_abs_timestamps):
        current_ev_num = ev_idx + 1

        # Mapping progress to 25% - 85% range
        # (100% - 25% start - 15% end = 60% for verification)
        if progress_callback and total_video_candidates > 0:
            ev_prog = 25 + (ev_idx / total_video_candidates * 60)
            progress_callback(
                int(ev_prog),
                "event_verification",
                f"Verifying event: {current_ev_num}/{total_video_candidates}",
                verified_count=len(all_verified_events),
                total_events=total_video_candidates,
                current_events=all_verified_events[-5:],
            )

        # ── SPEED: skip if this event falls inside the previous clip window ──
        if abs_ts < last_clip_end_time - 5:
            print(
                f"\n--- Event {current_ev_num}/{total_video_candidates} at {abs_ts:.2f}s --- ⏭️  SKIPPED (Duplicate window)"
            )
            continue

        print(
            f"\n--- Event {current_ev_num}/{total_video_candidates} at {abs_ts:.2f}s ---"
        )
        event_dir = os.path.join(output_base, f"event_{current_ev_num}")
        os.makedirs(event_dir, exist_ok=True)

        t_pts = {}
        scores = {}

        def is_readable(data):
            return data is not None and data.get("score") is not None

        def get_valid_ss(base_key, base_ts, fallbacks):
            base_ts = max(0, base_ts)
            t_pts[base_key] = base_ts
            img_path = os.path.join(event_dir, f"{base_key}.jpg")
            capture_scoreboard_full_width(shared_cap, base_ts, img_path)
            data = get_score_from_image_ai(img_path)
            scores[base_key] = data
            if is_readable(data):
                return base_key, data

            for fb_name, offset in fallbacks:
                fb_ts = max(0, base_ts + offset)
                fb_key = f"{base_key}_{fb_name}"
                t_pts[fb_key] = fb_ts
                fb_img = os.path.join(event_dir, f"{fb_key}.jpg")
                capture_scoreboard_full_width(shared_cap, fb_ts, fb_img)
                fb_data = get_score_from_image_ai(fb_img)
                scores[fb_key] = fb_data
                if is_readable(fb_data):
                    return fb_key, fb_data
            return base_key, data

        # Resolve S1, S2, S3
        s1_key, s1_data = get_valid_ss("S1", abs_ts - 19, [("S4", -29), ("S5", -39)])
        s2_key, s2_data = get_valid_ss("S2", abs_ts, [("S4", -5)])
        s3_key, s3_data = get_valid_ss("S3", abs_ts + 16, [("S4", 26), ("S5", 36)])

        # Compare and Verify
        def compare_pair(k1, d1, k2, d2, label=""):
            if not is_readable(d1) or not is_readable(d2):
                return None, 0.0
            sc_diff = d2["score"] - d1["score"]
            wk1, wk2 = d1.get("wicket"), d2.get("wicket")
            conf = min(d1.get("confidence", 0.5), d2.get("confidence", 0.5))
            if wk1 is not None and wk2 is not None:
                if wk2 > wk1:
                    return "WICKET", conf
                if wk2 < wk1:
                    # Scoreboard reverted - clearly not a new event
                    return None, 0.0

            if sc_diff == 6:
                return "SIX", conf
            if sc_diff == 4:
                return "FOUR", conf
            
            if sc_diff < 0:
                # Scoreboard reverted or OCR error
                return None, 0.0

            return None, 0.0

        verified = False
        event_type = None
        prev_data = curr_data = prev_key_final = curr_key_final = None

        comparisons = [
            (s1_key, s1_data, s2_key, s2_data),
            (s1_key, s1_data, s3_key, s3_data),
            (s2_key, s2_data, s3_key, s3_data),
        ]
        for k1, d1, k2, d2 in comparisons:
            e_type, conf = compare_pair(k1, d1, k2, d2, label=f"{k1}-{k2}")
            if e_type:
                verified, event_type = True, e_type
                prev_data, curr_data = d1, d2
                prev_key_final, curr_key_final = k1, k2
                break

        if verified:
            wk_change = (curr_data.get("wicket", 0) or 0) > (
                prev_data.get("wicket", 0) or 0
            )
            
            # --- GHOST WICKET / REVERTED DECISION CHECK ---
            # If we found a wicket, but a later screenshot (S3) shows fewer wickets than our 'current' detection,
            # then the umpire likely overturned the decision.
            if event_type == "WICKET" and is_readable(s3_data):
                if s3_data.get("wicket", 0) < curr_data.get("wicket", 0):
                    print(f"    🚫 GHOST WICKET DETECTED: Decision likely overturned (Scoreboard: {curr_data['wicket']} -> {s3_data['wicket']})")
                    verified = False
            
            if verified:
                transition_key = (prev_data["score"], curr_data["score"], wk_change)
                if transition_key in verified_score_transitions:
                    print(
                        f"    ⏭️  DUPLICATE transition {prev_data['score']}→{curr_data['score']} already captured"
                    )
                    verified = False

        if verified:
            verified_score_transitions.add(transition_key)
            last_clip_end_time = abs_ts + 16
            print(f"    ✨ VERIFIED: {event_type}")

            d1_clean = get_score_from_image_ai(
                os.path.join(event_dir, f"{prev_key_final}.jpg"), is_verified=True
            )
            d2_clean = get_score_from_image_ai(
                os.path.join(event_dir, f"{curr_key_final}.jpg"), is_verified=True
            )

            def format_score(data, raw):
                over = "0.0"
                if data and data.get("clean_text"):
                    m2 = re.search(r"(\d+\.\d+)", str(data["clean_text"]))
                    if m2:
                        over = m2.group(1)
                runs = raw["score"]
                wickets = raw["wicket"] if raw["wicket"] is not None else 0
                return f"{runs}/{wickets} ({over})"

            prev_str, curr_str = format_score(d1_clean, prev_data), format_score(
                d2_clean, curr_data
            )
            try:
                over_start = prev_str.split("(")[1].split(")")[0]
                over_end = curr_str.split("(")[1].split(")")[0]
            except:
                over_start = over_end = "0.0"

            all_verified_events.append(
                {
                    "event_id": current_ev_num,
                    "time_window": f"{over_start}-{over_end}",
                    "event_type": event_type,
                    "event_value": (
                        (curr_data["score"] - prev_data["score"])
                        if event_type in ["FOUR", "SIX"]
                        else 1
                    ),
                    "runs_added": (
                        (curr_data["score"] - prev_data["score"])
                        if event_type in ["FOUR", "SIX"]
                        else 0
                    ),
                    "timestamp": abs_ts,
                    "previous": prev_str,
                    "current": curr_str,
                    "team": (
                        d2_clean.get("team")
                        if d2_clean and d2_clean.get("team")
                        else d1_clean.get("team") if d1_clean else None
                    ),
                    "comparison_keys": f"{prev_key_final} & {curr_key_final}",
                }
            )

            clips_dir = os.path.join(output_base, "verified_clips")
            os.makedirs(clips_dir, exist_ok=True)
            temp_clip_path = os.path.join(event_dir, f"highlight_{current_ev_num}.mp4")
            final_clip_path = os.path.join(clips_dir, f"highlight_{current_ev_num}.mp4")

            clip_start_time = max(0, abs_ts - 19)
            print(f"    ✂️  Cutting clip {current_ev_num}/{total_video_candidates}...")
            try:
                subprocess.check_call(
                    f'ffmpeg -ss {clip_start_time} -t 35 -i "{video_path}" -c:v libx264 -preset ultrafast "{temp_clip_path}" -y -loglevel error',
                    shell=True,
                )
                shutil.move(temp_clip_path, final_clip_path)
                all_verified_clips_paths.append(final_clip_path)
                shutil.rmtree(event_dir, ignore_errors=True)
                print(f"    🧹 Cleaned up (saved space)")
            except Exception as e:
                logging.error(f"Clip failed: {e}")
        else:
            print("    ℹ️  Skipped (No clear score change found)")
            shutil.rmtree(event_dir, ignore_errors=True)

    # PHASE 3: FINAL MATCH STATE CAPTURE
    _log("PHASE 3: Capturing final match state...", "STEP")
    final_state_ts = max(0, duration - 5)
    final_img_path = os.path.join(output_base, "final_scoreboard.jpg")

    match_result_str = None
    if capture_scoreboard_full_width(shared_cap, final_state_ts, final_img_path):
        final_data = get_score_from_image_ai(final_img_path, is_verified=True)
        if final_data and final_data.get("match_result"):
            match_result_str = final_data["match_result"]
            print(f"    🏆 MATCH RESULT DETECTED: {match_result_str}")

        # Also add this as a special event if it contains winner info
        if match_result_str:
            all_verified_events.append(
                {
                    "event_id": 999,  # Special ID for final result
                    "event_type": "MATCH_RESULT",
                    "timestamp": final_state_ts,
                    "match_result": match_result_str,
                    "current": final_data.get("clean_text", "Result"),
                }
            )

    # Release shared VideoCapture
    shared_cap.release()

    # MERGE ALL CLIPS
    # Keep final video INSIDE output_base to avoid race conditions with other sessions
    final_video_path = os.path.join(output_base, "final_highlights.mp4")

    if progress_callback:
        progress_callback(85, "merging", "Merging highlight clips...")

    if all_verified_clips_paths:
        print(f"\n🔗 Merging {len(all_verified_clips_paths)} clips...")
        merge_list = os.path.join(output_base, "clips_to_merge.txt")
        with open(merge_list, "w", encoding="utf-8") as f:
            for p in all_verified_clips_paths:
                safe_path = os.path.abspath(p).replace("\\", "/")
                f.write(f"file '{safe_path}'\n")

        subprocess.call(
            f'ffmpeg -f concat -safe 0 -i "{merge_list}" -c copy "{final_video_path}" -y -loglevel quiet',
            shell=True,
        )
    else:
        print("⚠️  No verified events found — no highlight video generated.")

    if all_verified_events:
        _log("PHASE 2.7: Performing Global Consistency Check...", "STEP")
        refined_events = []
        for i, ev in enumerate(all_verified_events):
            if ev.get("event_type") == "WICKET":
                try:
                    curr_str = ev.get("current", "0/0")
                    match = re.search(r"[\-/](\d+)", curr_str)
                    if match:
                        wickets_at_event = int(match.group(1))
                        
                        # Look ahead: if any later stable event has fewer wickets, this was a ghost
                        is_ghost = False
                        # Check up to next 4 events
                        for j in range(i + 1, min(i + 5, len(all_verified_events))):
                            next_ev = all_verified_events[j]
                            if next_ev.get("event_type") == "MATCH_RESULT": continue
                            
                            next_str = next_ev.get("current", "0/0")
                            next_match = re.search(r"[\-/](\d+)", next_str)
                            if next_match:
                                next_wickets = int(next_match.group(1))
                                if next_wickets < wickets_at_event:
                                    is_ghost = True
                                    _log(f"   🚫 GLOBAL CHECK: Event {ev['event_id']} (Wicket {wickets_at_event}) is a GHOST. Later event shows {next_wickets} wickets.", "WARN")
                                    break
                        if is_ghost: continue
                except Exception:
                    pass
            refined_events.append(ev)
        all_verified_events = refined_events

    json_path = os.path.join(output_base, "verified_events.json")
    with open(json_path, "w") as f:
        json.dump(all_verified_events, f, indent=4)
    print(f"\n✅ Verified events saved: {json_path}")

    # SUMMARY GENERATION
    if progress_callback:
        progress_callback(95, "summary", "Generating AI match report...")

    summary_generator.generate_summary(json_path)

    if progress_callback:
        progress_callback(100, "complete", "Processing complete!")

    print(f"\n🎉 DONE!  →  {final_video_path}")
    # NOTE: We no longer delete output_base here because the calling task
    # (in tasks.py) needs to read the JSON and move the video before cleaning up.

    # Cleanup: Delete original uploaded video to save space immediately
    if videos and os.path.exists(video_path):
        try:
            os.remove(video_path)
            print(f"🧹 Cleaned up original upload: {video_path}")
        except Exception:
            pass

    return {
        "success": True,
        "verified_events": all_verified_events,
        "clips_generated": len(all_verified_clips_paths),
        "output_video": os.path.abspath(final_video_path),
        "event_analysis_dir": os.path.abspath(output_base),
    }


if __name__ == "__main__":
    generate_highlights()
