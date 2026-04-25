"""
Processing Engine Configuration Module

Centralized configuration and environment variable management for the processing engine.
"""

import os
from pathlib import Path
from dotenv import load_dotenv


def load_env(env_path=None):
    """Load environment variables from .env file."""
    if env_path:
        load_dotenv(env_path)
    else:
        load_dotenv()


class PathConfig:
    """Path configuration for processing engine."""
    
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = Path.cwd()
        else:
            base_dir = Path(base_dir)
        
        self.base_dir = base_dir
        self.media_root = base_dir / os.getenv("MEDIA_ROOT", "media")
        self.temp_root = base_dir / os.getenv("TEMP_ROOT", "temp")
        self.event_analysis_root = base_dir / os.getenv("EVENT_ANALYSIS_ROOT", "event_analysis")
        self.logs_root = base_dir / os.getenv("LOGS_ROOT", "logs")
        
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create directories if they don't exist."""
        for path in [self.media_root, self.temp_root, self.event_analysis_root, self.logs_root]:
            path.mkdir(parents=True, exist_ok=True)
    
    def get_media_path(self, filename):
        """Get full path for media file."""
        return self.media_root / filename
    
    def get_temp_path(self, filename):
        """Get full path for temp file."""
        return self.temp_root / filename
    
    def get_event_analysis_path(self, filename=""):
        """Get full path for event analysis file/directory."""
        return self.event_analysis_root / filename
    
    def get_logs_path(self, filename):
        """Get full path for log file."""
        return self.logs_root / filename


class ProcessingConfig:
    """Processing parameters configuration."""
    
    # Audio Analysis
    AUDIO_THRESHOLD_MULTIPLIER = 3.5
    AUDIO_PEAK_MIN_GAP_SECONDS = 35
    AUDIO_BITRATE = "160k"
    AUDIO_CHANNELS = 2
    AUDIO_SAMPLE_RATE = 44100
    
    # Scoreboard Capture
    SCOREBOARD_ROI_TOP_PERCENT = 0.90
    SCREENSHOT_TIMES = {
        "S1_OFFSET": -19,  # seconds before event
        "S2_OFFSET": 0,    # at event time
        "S3_OFFSET": 10,   # seconds after event
        "S4_OFFSET": 20    # backup screenshot
    }
    
    # Event Verification
    BOUNDARY_RUNS = [4, 6]
    MAX_WICKETS = 10
    MIN_READABLE_SCREENSHOTS = 2
    
    # Clip Generation
    CLIP_DURATION = 25  # seconds
    VIDEO_CODEC = "libx264"
    AUDIO_CODEC = "aac"
    VIDEO_PRESET = "ultrafast"
    
    # OCR Retry
    OCR_MAX_RETRIES = 2
    OCR_RETRY_DELAY = 5  # seconds


class APIConfig:
    """API credentials configuration."""
    
    def __init__(self):
        load_env()
        self.google_credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if self.google_credentials_path:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.google_credentials_path
    
    def validate(self):
        """Validate that required API credentials are present."""
        errors = []
        
        if not self.google_credentials_path:
            errors.append("GOOGLE_APPLICATION_CREDENTIALS not set in environment")
        elif not os.path.exists(self.google_credentials_path):
            errors.append(f"Google credentials file not found: {self.google_credentials_path}")
        
        if not self.openai_api_key:
            errors.append("OPENAI_API_KEY not set in environment")
        
        return errors


# Global configuration instances
def get_path_config(base_dir=None):
    """Get path configuration instance."""
    return PathConfig(base_dir)


def get_processing_config():
    """Get processing configuration instance."""
    return ProcessingConfig()


def get_api_config():
    """Get API configuration instance."""
    return APIConfig()
