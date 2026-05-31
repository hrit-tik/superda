"""
Superda Backend — Analyze Router
Endpoint for URL analysis and metadata extraction.
"""

from fastapi import APIRouter, HTTPException

from models import AnalyzeRequest, VideoMetadata, ErrorResponse
from services.analyzer import analyze_url

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post(
    "/analyze",
    response_model=VideoMetadata,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid URL or analysis failed"},
        429: {"model": ErrorResponse, "description": "Rate limited"},
    },
    summary="Analyze a video URL",
    description="Extract metadata and available formats from a video URL using yt-dlp.",
)
async def analyze(request: AnalyzeRequest):
    """
    Analyze a video URL and return metadata with all available formats.
    This does NOT download the video — it only extracts information.
    """
    try:
        metadata = await analyze_url(request.url)
        return metadata
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
