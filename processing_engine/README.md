# Processing Engine - Video Analysis & Highlight Generation

## Responsibility

The processing engine contains all heavy computational modules for video analysis and highlight generation. This is kept separate from Django to:

- **Maintain separation of concerns** between API logic and processing logic
- **Enable independent scaling** of processing workers
- **Facilitate testing** of processing algorithms in isolation
- **Support reusability** across different interfaces (CLI, API, batch processing)

## Core Modules

### `video_processor.py`
**Purpose**: Main video processing pipeline  
**Functions**:
- Video ingestion and validation
- Frame extraction and analysis
- Audio peak detection (crowd noise, commentary spikes)
- OCR for scoreboard reading
- Event detection (boundaries, wickets)
- Highlight clip generation using FFmpeg
- Output: Verified events JSON and video clips

**Key Technologies**: OpenCV, FFmpeg, PyTesseract, NumPy, Librosa

### `summary_generator.py`
**Purpose**: AI-powered match summary generation  
**Functions**:
- Read verified events from JSON
- Generate natural language summaries using LLM
- Format report-style output with over-by-over commentary
- Include key statistics and match flow

**Key Technologies**: OpenAI API, LangChain (optional)

## Supporting Modules (Planned)

- `audio_analyzer.py` - Audio processing and peak detection
- `ocr_engine.py` - Scoreboard text extraction
- `event_detector.py` - Cricket event classification
- `clip_generator.py` - Video segment extraction and merging
- `config.py` - Processing configuration and constants
- `utils.py` - Shared utility functions

## Input/Output

**Input**:
- Raw cricket match video (MP4, AVI, MKV)
- Configuration parameters (sensitivity, thresholds)

**Output**:
- `event_analysis/verified_events.json` - Detected events with timestamps
- `media/highlights/` - Generated highlight video clips
- `media/summaries/` - Text summaries in JSON/TXT format
- `logs/processing_*.log` - Processing logs

## Performance Considerations

- Multiprocessing for parallel frame analysis
- Async I/O for file operations
- Efficient memory management for large videos
- Progress tracking and resumability

## Development

(Setup instructions will be added in Phase 2)
