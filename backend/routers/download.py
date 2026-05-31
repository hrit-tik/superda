"""
Superda Backend — Download Router
Endpoints for managing downloads: start, progress, cancel, pause, resume, and file retrieval.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse

from models import (
    DownloadRequest,
    DownloadTask,
    ErrorResponse,
    TaskResponse,
)
from services.downloader import (
    cancel_task,
    create_task,
    get_all_tasks,
    get_task,
    pause_task,
    resume_task,
)
from services.file_manager import get_task_file, validate_file_path
from services.progress import progress_event_generator

router = APIRouter(prefix="/api", tags=["download"])


@router.post(
    "/download",
    response_model=TaskResponse,
    responses={400: {"model": ErrorResponse}},
    summary="Start a download",
    description="Create a new download task with the specified format and options.",
)
async def start_download(request: DownloadRequest):
    """Start a new download task. Returns a task_id for tracking progress."""
    try:
        task = create_task(request)
        return TaskResponse(
            task_id=task.task_id,
            status=task.status,
            message="Download task created",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start download: {str(e)}")


@router.get(
    "/download/{task_id}/progress",
    summary="Stream download progress",
    description="Server-Sent Events stream of real-time download progress.",
)
async def stream_progress(task_id: str):
    """
    SSE endpoint that streams download progress events.
    Events: 'progress' (data updates), 'heartbeat' (keepalive), 'done' (terminal state).
    """
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return EventSourceResponse(
        progress_event_generator(task_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for SSE
        },
    )


@router.post(
    "/download/{task_id}/cancel",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Cancel a download",
)
async def cancel_download(task_id: str):
    """Cancel a running or paused download task."""
    success = cancel_task(task_id)
    if not success:
        task = get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=400, detail=f"Cannot cancel task in state: {task.status}")

    return TaskResponse(task_id=task_id, message="Download cancelled")


@router.post(
    "/download/{task_id}/pause",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Pause a download",
)
async def pause_download(task_id: str):
    """Pause a running download."""
    success = pause_task(task_id)
    if not success:
        task = get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=400, detail=f"Cannot pause task in state: {task.status}")

    return TaskResponse(task_id=task_id, message="Download paused")


@router.post(
    "/download/{task_id}/resume",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Resume a download",
)
async def resume_download(task_id: str):
    """Resume a paused download."""
    success = resume_task(task_id)
    if not success:
        task = get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=400, detail=f"Cannot resume task in state: {task.status}")

    return TaskResponse(task_id=task_id, message="Download resumed")


@router.get(
    "/download/{task_id}/file",
    summary="Download completed file",
    description="Retrieve the downloaded file. Only available after task completion.",
)
async def download_file(task_id: str):
    """
    Serve the completed download file.
    Returns the file as a streaming download response.
    """
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != "completed":
        raise HTTPException(status_code=400, detail="Download not yet completed")

    file_path = get_task_file(task_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if not validate_file_path(file_path):
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="application/octet-stream",
    )


@router.get(
    "/downloads",
    response_model=list[DownloadTask],
    summary="List all download tasks",
    description="Get a list of all download tasks (active, completed, failed).",
)
async def list_downloads():
    """List all download tasks, sorted by creation time (newest first)."""
    return get_all_tasks()
