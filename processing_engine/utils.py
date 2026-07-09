"""
Processing Engine Utility Functions

Shared utility functions for file management, validation, and helpers.
"""

import os
import re
from pathlib import Path
from datetime import datetime
import subprocess


def safe_mkdir(path):
    """
    Create directory if it doesn't exist.
    
    Args:
        path (str or Path): Directory path to create
        
    Returns:
        Path: Created directory path
    """
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    return path


def timestamped_folder(base, prefix="event"):
    """
    Generate timestamped folder name.
    
    Args:
        base (str or Path): Base directory
        prefix (str): Folder name prefix
        
    Returns:
        Path: Timestamped folder path
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    folder_name = f"{prefix}_{timestamp}"
    return Path(base) / folder_name


def cleanup_temp_files(*paths):
    """
    Safely remove temporary files.
    
    Args:
        *paths: Variable number of file paths to remove
    """
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def format_timestamp(seconds):
    """
    Convert seconds to HH:MM:SS format.
    
    Args:
        seconds (float): Time in seconds
        
    Returns:
        str: Formatted timestamp (HH:MM:SS)
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def validate_video_file(path):
    """
    Validate video file format and accessibility.
    
    Args:
        path (str): Path to video file
        
    Returns:
        tuple: (bool, str) - (is_valid, error_message)
    """
    if not os.path.exists(path):
        return False, f"Video file not found: {path}"
    
    valid_extensions = ['.mp4', '.mkv', '.avi', '.mov']
    ext = os.path.splitext(path)[1].lower()
    
    if ext not in valid_extensions:
        return False, f"Invalid video format: {ext}. Supported: {', '.join(valid_extensions)}"
    
    if os.path.getsize(path) == 0:
        return False, "Video file is empty"
    
    return True, ""


def get_video_duration(video_path):
    """
    Get video duration using FFmpeg.
    
    Args:
        video_path (str): Path to video file
        
    Returns:
        float: Duration in seconds, or None if error
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception:
        return None


def clean_scoreboard_text(ocr_text):
    """
    Clean and format scoreboard OCR text.
    
    Args:
        ocr_text (str): Raw OCR text from scoreboard
        
    Returns:
        str: Cleaned and formatted scoreboard text
    """
    text = ocr_text.replace("/", " ").replace("|", " ").replace(",", " ")
    tokens = text.split()
    team = score = overs = total_overs = None

    # --- Team name ---
    candidate_teams = [t for t in tokens if t.isalpha() and t.isupper() and 2 <= len(t) <= 4]
    if candidate_teams:
        team = candidate_teams[0]
        for ct in candidate_teams:
            if ct not in ["P", "O", "V", "I", "II"]:
                team = ct
                break

    m = re.search(r'\d+\s*-\s*\d+', text)
    if m:
        score = m.group().replace(" ", "")

    for i, t in enumerate(tokens):
        if t.lower() == "p" and i + 1 < len(tokens):
            nxt = tokens[i + 1]
            if nxt.isdigit() and len(nxt) >= 2:
                overs = f"{nxt[0]}.{nxt[1]}"
                if i + 2 < len(tokens) and tokens[i + 2].isdigit():
                    total_overs = tokens[i + 2]
                elif len(nxt) >= 4:
                    total_overs = nxt[2:]
            break

    result = {"team": team, "score": score, "overs": overs, "total_overs": total_overs}
    if team and score and overs and total_overs:
        result["formatted"] = f"{team} {score} P {overs}/{total_overs}"
    elif team and score:
        result["formatted"] = f"{team} {score}"
    else:
        result["formatted"] = ocr_text

    return result


def parse_score_from_text(text):
    """
    Extract score and wicket information from OCR text.
    
    Args:
        text (str): OCR text containing score information
        
    Returns:
        dict: {'score': int, 'wicket': int or None} or None if parsing fails
    """
    match = re.search(r'(\d+)\s*[\-\/]\s*(\d+)', text)
    if match:
        return {
            'score': int(match.group(1)),
            'wicket': int(match.group(2)),
            'team': None # Will be filled by clean_scoreboard_text
        }
    
    nums = re.findall(r'\d+', text)
    if nums:
        return {
            'score': int(nums[0]),
            'wicket': None,
            'team': None
        }
    
    return None


def ensure_absolute_path(path, base_dir=None):
    """
    Ensure path is absolute, converting relative paths if needed.
    
    Args:
        path (str or Path): Input path
        base_dir (str or Path, optional): Base directory for relative paths
        
    Returns:
        Path: Absolute path
    """
    path = Path(path)
    if path.is_absolute():
        return path
    
    if base_dir:
        return Path(base_dir) / path
    
    return Path.cwd() / path
