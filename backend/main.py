"""
Superda Backend — FastAPI Application Entry Point
Main application with CORS, middleware, routers, and lifecycle hooks.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from middleware import RateLimitMiddleware, RequestLoggingMiddleware
from routers import analyze, download
from services.downloader import set_event_loop
from services.file_manager import periodic_cleanup

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("superda")


# ─── Lifecycle ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("🚀 Superda backend starting...")
    logger.info(f"   Download dir: {settings.download_path}")
    logger.info(f"   Max concurrent downloads: {settings.max_concurrent_downloads}")
    logger.info(f"   File cleanup interval: {settings.max_file_age_minutes} min")

    # Set the event loop for thread-safe progress updates
    loop = asyncio.get_running_loop()
    set_event_loop(loop)

    # Log yt-dlp version
    try:
        import yt_dlp.version
        logger.info(f"   yt-dlp version: {yt_dlp.version.__version__}")
    except Exception as e:
        logger.warning(f"   Could not determine yt-dlp version: {e}")

    # Write cookie file from environment variable if provided
    cookie_file = settings.resolved_cookie_file
    if cookie_file:
        logger.info(f"   Using cookies file: {cookie_file}")

    # Start periodic file cleanup
    cleanup_task = asyncio.create_task(periodic_cleanup())

    yield

    # Shutdown
    logger.info("Superda backend shutting down...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


# ─── App Creation ────────────────────────────────────────────────────────────

app = FastAPI(
    title="Superda API",
    description="Video format analyzer and downloader API powered by yt-dlp and FFmpeg.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── Middleware (order matters: first added = outermost) ─────────────────────

# CORS — must be added before custom middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# Rate limiting
app.add_middleware(RateLimitMiddleware)

# ─── Routers ─────────────────────────────────────────────────────────────────

app.include_router(analyze.router)
app.include_router(download.router)


# ─── Health Check ────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "superda-backend",
        "version": "1.0.0",
    }
