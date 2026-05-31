"""
Superda Backend — Pydantic Models
All request/response schemas for the API.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl


# ─── Enums ───────────────────────────────────────────────────────────────────

class DownloadStatus(str, Enum):
    """Possible states for a download task."""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    MERGING = "merging"
    CONVERTING = "converting"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    FAILED = "failed"


class AudioFormat(str, Enum):
    """Supported audio output formats."""
    ORIGINAL = "original"
    MP3 = "mp3"
    M4A = "m4a"
    WAV = "wav"
    FLAC = "flac"


class VideoContainer(str, Enum):
    """Supported video container formats."""
    ORIGINAL = "original"
    MP4 = "mp4"
    MKV = "mkv"
    WEBM = "webm"


# ─── Request Models ─────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Request body for URL analysis."""
    url: str = Field(..., description="Video URL to analyze", min_length=5)


class DownloadRequest(BaseModel):
    """Request body to start a download."""
    url: str = Field(..., description="Video URL to download")
    format_id: str | None = Field(None, description="Specific yt-dlp format ID")
    audio_only: bool = Field(False, description="Download audio only")
    video_only: bool = Field(False, description="Download video only (no audio)")
    audio_format: AudioFormat = Field(AudioFormat.ORIGINAL, description="Target audio format")
    video_container: VideoContainer = Field(VideoContainer.ORIGINAL, description="Target video container")
    best_quality: bool = Field(False, description="Download best available quality")
    smallest_file: bool = Field(False, description="Download smallest available file")
    best_audio: bool = Field(False, description="Download highest quality audio")


# ─── Response Models ─────────────────────────────────────────────────────────

class FormatInfo(BaseModel):
    """Information about a single available format."""
    format_id: str
    resolution: str | None = None
    width: int | None = None
    height: int | None = None
    fps: float | None = None
    vcodec: str | None = None
    acodec: str | None = None
    vbr: float | None = None          # Video bitrate in kbps
    abr: float | None = None          # Audio bitrate in kbps
    tbr: float | None = None          # Total bitrate in kbps
    container: str | None = None
    filesize: int | None = None       # Exact file size in bytes
    filesize_approx: int | None = None  # Approximate file size in bytes
    has_audio: bool = False
    has_video: bool = False
    dynamic_range: str | None = None  # SDR, HDR, HDR10, etc.
    sample_rate: int | None = None    # Audio sample rate in Hz
    audio_channels: int | None = None
    format_note: str | None = None


class VideoMetadata(BaseModel):
    """Complete metadata returned from URL analysis."""
    title: str
    thumbnail: str | None = None
    duration: float | None = None     # Duration in seconds
    duration_string: str | None = None
    uploader: str | None = None
    upload_date: str | None = None    # YYYYMMDD format from yt-dlp
    view_count: int | None = None
    description: str | None = None
    webpage_url: str | None = None
    extractor: str | None = None      # Platform name
    formats: list[FormatInfo] = []


class DownloadProgress(BaseModel):
    """Real-time progress data for a download task."""
    task_id: str
    status: DownloadStatus = DownloadStatus.PENDING
    progress: float = 0.0            # 0-100 percentage
    speed: str | None = None         # Human-readable speed (e.g., "5.2 MiB/s")
    eta: str | None = None           # Human-readable ETA
    downloaded: str | None = None    # Human-readable downloaded size
    total: str | None = None         # Human-readable total size
    filename: str | None = None
    phase: str = "waiting"           # Current processing phase description
    error: str | None = None


class DownloadTask(BaseModel):
    """Summary of a download task for listing."""
    task_id: str
    url: str
    title: str | None = None
    status: DownloadStatus = DownloadStatus.PENDING
    progress: float = 0.0
    filename: str | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: datetime | None = None
    filesize: int | None = None
    error: str | None = None


class TaskResponse(BaseModel):
    """Response when a download task is created."""
    task_id: str
    status: DownloadStatus = DownloadStatus.PENDING
    message: str = "Download task created"


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    error_code: str | None = None
