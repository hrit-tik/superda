"""
Superda Backend — File Manager Service
Handles temp file lifecycle, secure path validation, and periodic cleanup.
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import time
from pathlib import Path

from config import settings

logger = logging.getLogger(__name__)


def get_task_dir(task_id: str) -> Path:
    """
    Get or create the directory for a specific download task.
    All files for a task live in downloads/<task_id>/.
    """
    # Prevent path traversal by stripping dangerous characters
    safe_id = "".join(c for c in task_id if c.isalnum() or c in "-_")
    if not safe_id:
        raise ValueError("Invalid task ID")

    task_dir = settings.download_path / safe_id
    task_dir.mkdir(parents=True, exist_ok=True)
    return task_dir


def get_task_file(task_id: str) -> Path | None:
    """
    Find the downloaded file for a task.
    Returns the path to the first non-temp file in the task directory,
    or None if no file exists.
    """
    task_dir = get_task_dir(task_id)
    if not task_dir.exists():
        return None

    # Look for completed files (skip .part, .ytdl temp files)
    temp_extensions = {".part", ".ytdl", ".temp", ".tmp"}
    for f in task_dir.iterdir():
        if f.is_file() and f.suffix.lower() not in temp_extensions:
            return f

    return None


def validate_file_path(file_path: Path) -> bool:
    """
    Ensure a file path is within the download directory.
    Prevents path traversal attacks.
    """
    try:
        resolved = file_path.resolve()
        download_root = settings.download_path.resolve()
        return str(resolved).startswith(str(download_root))
    except (OSError, ValueError):
        return False


def cleanup_task_files(task_id: str) -> None:
    """Remove all files for a specific task."""
    try:
        task_dir = get_task_dir(task_id)
        if task_dir.exists():
            shutil.rmtree(task_dir, ignore_errors=True)
            logger.info(f"Cleaned up files for task {task_id}")
    except Exception as e:
        logger.warning(f"Failed to clean up task {task_id}: {e}")


async def periodic_cleanup(interval_seconds: int = 300) -> None:
    """
    Background task that periodically cleans up old download files.
    Runs every `interval_seconds` (default 5 minutes).
    Removes task directories older than MAX_FILE_AGE_MINUTES.
    """
    max_age = settings.max_file_age_minutes * 60  # Convert to seconds

    while True:
        try:
            await asyncio.sleep(interval_seconds)
            now = time.time()
            download_dir = settings.download_path

            if not download_dir.exists():
                continue

            cleaned = 0
            for item in download_dir.iterdir():
                if item.is_dir():
                    try:
                        # Check the directory's modification time
                        dir_age = now - item.stat().st_mtime
                        if dir_age > max_age:
                            shutil.rmtree(item, ignore_errors=True)
                            cleaned += 1
                    except OSError:
                        continue

            if cleaned > 0:
                logger.info(f"Periodic cleanup: removed {cleaned} expired task directories")

        except asyncio.CancelledError:
            logger.info("Periodic cleanup task cancelled")
            break
        except Exception as e:
            logger.error(f"Periodic cleanup error: {e}", exc_info=True)


def get_download_dir_size() -> int:
    """Get total size of the download directory in bytes."""
    total = 0
    try:
        for dirpath, dirnames, filenames in os.walk(settings.download_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    total += os.path.getsize(fp)
                except OSError:
                    continue
    except OSError:
        pass
    return total
