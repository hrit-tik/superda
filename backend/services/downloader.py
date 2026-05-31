"""
Superda Backend — Download Manager Service
Orchestrates downloads using yt-dlp with progress tracking, pause/resume, and format conversion.
"""

from __future__ import annotations

import asyncio
import logging
import os
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

import yt_dlp

from config import settings
from models import (
    AudioFormat,
    DownloadProgress,
    DownloadRequest,
    DownloadStatus,
    DownloadTask,
    VideoContainer,
)
from services.file_manager import get_task_dir, cleanup_task_files
from services.progress import update_progress

logger = logging.getLogger(__name__)

# ─── Task Registry ──────────────────────────────────────────────────────────

_tasks: dict[str, DownloadTask] = {}
_task_threads: dict[str, threading.Event] = {}  # Cancel events
_pause_events: dict[str, threading.Event] = {}  # Pause events (clear = paused)
_executor = ThreadPoolExecutor(max_workers=settings.max_concurrent_downloads)
_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Set the main event loop for thread-safe progress updates."""
    global _loop
    _loop = loop


def _emit_progress(task_id: str, progress: DownloadProgress) -> None:
    """Thread-safe helper to emit progress updates to the async SSE system."""
    if _loop is None:
        return
    asyncio.run_coroutine_threadsafe(update_progress(task_id, progress), _loop)


# ─── Public API ─────────────────────────────────────────────────────────────

def create_task(request: DownloadRequest) -> DownloadTask:
    """Create a new download task and start it in a background thread."""
    task_id = str(uuid.uuid4())[:12]  # Short IDs for convenience

    task = DownloadTask(
        task_id=task_id,
        url=request.url,
        status=DownloadStatus.PENDING,
        created_at=datetime.now(),
    )
    _tasks[task_id] = task

    # Create cancel and pause events
    cancel_event = threading.Event()
    pause_event = threading.Event()
    pause_event.set()  # Start in "running" state (set = not paused)
    _task_threads[task_id] = cancel_event
    _pause_events[task_id] = pause_event

    # Submit to thread pool
    _executor.submit(_download_worker, task_id, request, cancel_event, pause_event)

    return task


def get_task(task_id: str) -> DownloadTask | None:
    """Get a task by ID."""
    return _tasks.get(task_id)


def get_all_tasks() -> list[DownloadTask]:
    """Get all tasks, sorted by creation time (newest first)."""
    return sorted(_tasks.values(), key=lambda t: t.created_at, reverse=True)


def cancel_task(task_id: str) -> bool:
    """Cancel a running download task."""
    task = _tasks.get(task_id)
    if not task:
        return False

    if task.status in (DownloadStatus.COMPLETED, DownloadStatus.CANCELLED, DownloadStatus.FAILED):
        return False

    cancel_event = _task_threads.get(task_id)
    if cancel_event:
        cancel_event.set()

    # Also unpause so the thread can exit cleanly
    pause_event = _pause_events.get(task_id)
    if pause_event:
        pause_event.set()

    task.status = DownloadStatus.CANCELLED
    _emit_progress(task_id, DownloadProgress(
        task_id=task_id,
        status=DownloadStatus.CANCELLED,
        phase="cancelled",
    ))

    # Clean up files asynchronously
    cleanup_task_files(task_id)
    return True


def pause_task(task_id: str) -> bool:
    """Pause a running download."""
    task = _tasks.get(task_id)
    if not task or task.status != DownloadStatus.DOWNLOADING:
        return False

    pause_event = _pause_events.get(task_id)
    if pause_event:
        pause_event.clear()  # Clear = paused
        task.status = DownloadStatus.PAUSED
        _emit_progress(task_id, DownloadProgress(
            task_id=task_id,
            status=DownloadStatus.PAUSED,
            progress=task.progress,
            phase="paused",
        ))
        return True
    return False


def resume_task(task_id: str) -> bool:
    """Resume a paused download."""
    task = _tasks.get(task_id)
    if not task or task.status != DownloadStatus.PAUSED:
        return False

    pause_event = _pause_events.get(task_id)
    if pause_event:
        pause_event.set()  # Set = running
        task.status = DownloadStatus.DOWNLOADING
        _emit_progress(task_id, DownloadProgress(
            task_id=task_id,
            status=DownloadStatus.DOWNLOADING,
            progress=task.progress,
            phase="resuming",
        ))
        return True
    return False


# ─── Download Worker (runs in thread) ───────────────────────────────────────

def _build_format_string(request: DownloadRequest) -> str:
    """Build the yt-dlp format selection string from a DownloadRequest."""
    if request.format_id:
        return request.format_id

    if request.audio_only or request.best_audio:
        return "bestaudio/best"

    if request.smallest_file:
        return "worstvideo+worstaudio/worst"

    if request.video_only:
        return "bestvideo"

    if request.best_quality:
        return "bestvideo+bestaudio/best"

    # Default: best quality with audio
    return "bestvideo+bestaudio/best"


def _build_postprocessors(request: DownloadRequest) -> list[dict]:
    """Build yt-dlp postprocessor list based on download options."""
    postprocessors = []

    # Audio extraction / conversion
    if request.audio_only or request.best_audio:
        if request.audio_format != AudioFormat.ORIGINAL:
            postprocessors.append({
                "key": "FFmpegExtractAudio",
                "preferredcodec": request.audio_format.value,
                "preferredquality": "0",  # Best quality
            })
        else:
            postprocessors.append({
                "key": "FFmpegExtractAudio",
                "preferredcodec": "best",
                "preferredquality": "0",
            })

    # Video container conversion
    elif request.video_container != VideoContainer.ORIGINAL:
        postprocessors.append({
            "key": "FFmpegVideoConvertor",
            "preferedformat": request.video_container.value,
        })

    return postprocessors


def _format_bytes(bytes_val: float | None) -> str | None:
    """Format bytes into human-readable string."""
    if bytes_val is None:
        return None
    for unit in ("B", "KiB", "MiB", "GiB"):
        if abs(bytes_val) < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TiB"


def _download_worker(
    task_id: str,
    request: DownloadRequest,
    cancel_event: threading.Event,
    pause_event: threading.Event,
) -> None:
    """
    Background worker that performs the actual download.
    Runs in a thread pool thread.
    """
    task = _tasks[task_id]
    task_dir = get_task_dir(task_id)

    def progress_hook(d: dict) -> None:
        """yt-dlp progress callback — runs in the download thread."""
        # Check for cancellation
        if cancel_event.is_set():
            raise yt_dlp.utils.DownloadCancelled("Download cancelled by user")

        # Handle pause: block until unpaused
        if not pause_event.is_set():
            task.status = DownloadStatus.PAUSED
            pause_event.wait()  # Blocks until set() is called
            if cancel_event.is_set():
                raise yt_dlp.utils.DownloadCancelled("Download cancelled while paused")

        status = d.get("status")

        if status == "downloading":
            task.status = DownloadStatus.DOWNLOADING

            # Parse progress percentage
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            downloaded = d.get("downloaded_bytes", 0)
            pct = 0.0
            if total and total > 0:
                pct = min((downloaded / total) * 100, 100.0)

            task.progress = pct

            _emit_progress(task_id, DownloadProgress(
                task_id=task_id,
                status=DownloadStatus.DOWNLOADING,
                progress=round(pct, 1),
                speed=d.get("_speed_str", "").strip() or None,
                eta=d.get("_eta_str", "").strip() or None,
                downloaded=_format_bytes(downloaded),
                total=_format_bytes(total),
                filename=d.get("filename", "").split(os.sep)[-1] if d.get("filename") else None,
                phase="downloading",
            ))

        elif status == "finished":
            _emit_progress(task_id, DownloadProgress(
                task_id=task_id,
                status=DownloadStatus.MERGING,
                progress=100.0,
                phase="processing",
                filename=d.get("filename", "").split(os.sep)[-1] if d.get("filename") else None,
            ))

    def postprocessor_hook(d: dict) -> None:
        """yt-dlp postprocessor callback."""
        status = d.get("status")
        if status == "started":
            _emit_progress(task_id, DownloadProgress(
                task_id=task_id,
                status=DownloadStatus.CONVERTING,
                progress=100.0,
                phase="converting / merging",
            ))
        elif status == "finished":
            _emit_progress(task_id, DownloadProgress(
                task_id=task_id,
                status=DownloadStatus.CONVERTING,
                progress=100.0,
                phase="finalizing",
            ))

    # Build yt-dlp options
    output_template = str(task_dir / "%(title)s.%(ext)s")
    format_string = _build_format_string(request)
    postprocessors = _build_postprocessors(request)

    ydl_opts = {
        "format": format_string,
        "outtmpl": output_template,
        "progress_hooks": [progress_hook],
        "postprocessor_hooks": [postprocessor_hook],
        "postprocessors": postprocessors,
        "quiet": True,
        "no_warnings": True,
        "continuedl": True,  # Support resume
        "noprogress": True,
        # FFmpeg location
        "ffmpeg_location": settings.resolved_ffmpeg_path,
        # Merge output format preference
        "merge_output_format": "mp4" if request.video_container == VideoContainer.ORIGINAL else request.video_container.value,
    }

    cookie_file = settings.resolved_cookie_file
    if cookie_file:
        ydl_opts["cookiefile"] = cookie_file
    elif settings.cookies_from_browser:
        ydl_opts["cookiesfrombrowser"] = (settings.cookies_from_browser,)

    try:
        _emit_progress(task_id, DownloadProgress(
            task_id=task_id,
            status=DownloadStatus.PENDING,
            phase="starting download",
        ))

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first to get the title
            info = ydl.extract_info(request.url, download=False)
            if info:
                task.title = info.get("title", "Unknown")

            # Now download
            ydl.download([request.url])

        # Mark as completed
        task.status = DownloadStatus.COMPLETED
        task.completed_at = datetime.now()

        # Find the output file
        from services.file_manager import get_task_file
        output_file = get_task_file(task_id)
        if output_file:
            task.filename = output_file.name
            task.filesize = output_file.stat().st_size

        _emit_progress(task_id, DownloadProgress(
            task_id=task_id,
            status=DownloadStatus.COMPLETED,
            progress=100.0,
            phase="completed",
            filename=task.filename,
            total=_format_bytes(task.filesize),
        ))

        logger.info(f"Task {task_id} completed: {task.filename}")

    except yt_dlp.utils.DownloadCancelled:
        task.status = DownloadStatus.CANCELLED
        logger.info(f"Task {task_id} cancelled")

    except Exception as e:
        task.status = DownloadStatus.FAILED
        task.error = str(e)
        _emit_progress(task_id, DownloadProgress(
            task_id=task_id,
            status=DownloadStatus.FAILED,
            phase="failed",
            error=str(e),
        ))
        logger.error(f"Task {task_id} failed: {e}", exc_info=True)
