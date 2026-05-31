"""
Superda Backend — SSE Progress Manager
Manages real-time progress updates for download tasks via Server-Sent Events.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections import defaultdict

from models import DownloadProgress, DownloadStatus

logger = logging.getLogger(__name__)

# ─── In-Memory Progress Store ───────────────────────────────────────────────

# task_id → latest DownloadProgress
_progress_store: dict[str, DownloadProgress] = {}

# task_id → list of asyncio.Queue for SSE subscribers
_subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

# Lock for thread-safe writes from download threads
_lock = asyncio.Lock()


async def update_progress(task_id: str, progress: DownloadProgress) -> None:
    """
    Update progress for a task and notify all SSE subscribers.
    Called from download threads (via asyncio.run_coroutine_threadsafe).
    """
    async with _lock:
        _progress_store[task_id] = progress
        # Push to all subscribers for this task
        for queue in _subscribers.get(task_id, []):
            try:
                queue.put_nowait(progress)
            except asyncio.QueueFull:
                # Drop oldest if queue is full (prevent memory issues)
                try:
                    queue.get_nowait()
                    queue.put_nowait(progress)
                except asyncio.QueueEmpty:
                    pass


def get_progress(task_id: str) -> DownloadProgress | None:
    """Get the latest progress for a task (non-async for convenience)."""
    return _progress_store.get(task_id)


async def subscribe(task_id: str) -> asyncio.Queue:
    """
    Create a new SSE subscription for a task.
    Returns an asyncio.Queue that will receive DownloadProgress updates.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    async with _lock:
        _subscribers[task_id].append(queue)

        # Send current state immediately if available
        current = _progress_store.get(task_id)
        if current:
            queue.put_nowait(current)

    return queue


async def unsubscribe(task_id: str, queue: asyncio.Queue) -> None:
    """Remove an SSE subscription."""
    async with _lock:
        if task_id in _subscribers:
            try:
                _subscribers[task_id].remove(queue)
            except ValueError:
                pass
            # Clean up empty subscriber lists
            if not _subscribers[task_id]:
                del _subscribers[task_id]


async def progress_event_generator(task_id: str):
    """
    Async generator that yields SSE-formatted events for a download task.
    Used by the SSE endpoint.
    """
    queue = await subscribe(task_id)
    heartbeat_interval = 5  # seconds
    last_heartbeat = time.time()

    try:
        while True:
            try:
                # Wait for progress update with timeout for heartbeats
                progress = await asyncio.wait_for(
                    queue.get(), timeout=heartbeat_interval
                )

                data = progress.model_dump_json()
                yield {
                    "event": "progress",
                    "data": data,
                }

                # If task reached a terminal state, send final event and stop
                if progress.status in (
                    DownloadStatus.COMPLETED,
                    DownloadStatus.FAILED,
                    DownloadStatus.CANCELLED,
                ):
                    yield {
                        "event": "done",
                        "data": data,
                    }
                    return

            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                now = time.time()
                if now - last_heartbeat >= heartbeat_interval:
                    yield {"event": "heartbeat", "data": ""}
                    last_heartbeat = now

    except asyncio.CancelledError:
        logger.debug(f"SSE connection cancelled for task {task_id}")
    finally:
        await unsubscribe(task_id, queue)


def cleanup_task(task_id: str) -> None:
    """Remove all progress data for a completed task."""
    _progress_store.pop(task_id, None)
    _subscribers.pop(task_id, None)
