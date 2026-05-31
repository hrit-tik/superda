"""
Superda Backend — URL Analyzer Service
Extracts video metadata and available formats using yt-dlp's Python API.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

import yt_dlp

from config import settings
from models import FormatInfo, VideoMetadata

logger = logging.getLogger(__name__)

# ─── URL Validation ─────────────────────────────────────────────────────────

# Broad pattern: must look like a valid HTTP(S) URL
_URL_PATTERN = re.compile(
    r"^https?://"                   # scheme
    r"[a-zA-Z0-9\-.]+"             # domain
    r"(?:\.[a-zA-Z]{2,})"          # TLD
    r"(?::\d{1,5})?"               # optional port
    r"(?:/[^\s]*)?$"               # path
)


def validate_url(url: str) -> str:
    """
    Validate and sanitize a user-provided URL.
    Returns the cleaned URL or raises ValueError.
    """
    url = url.strip()

    if not _URL_PATTERN.match(url):
        raise ValueError(f"Invalid URL format: {url}")

    parsed = urlparse(url)

    # Must be http or https
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Unsupported URL scheme: {parsed.scheme}")

    # Reject obviously dangerous patterns
    if any(c in url for c in ["|", "`"]):
        raise ValueError("URL contains disallowed characters")

    return url


# ─── Format Parsing ─────────────────────────────────────────────────────────

def _parse_format(fmt: dict, duration: float | None) -> FormatInfo:
    """Convert a single yt-dlp format dict into our FormatInfo model."""
    vcodec = fmt.get("vcodec", "none")
    acodec = fmt.get("acodec", "none")
    has_video = vcodec not in ("none", None, "")
    has_audio = acodec not in ("none", None, "")

    # Build resolution string
    width = fmt.get("width")
    height = fmt.get("height")
    resolution = None
    if height:
        label_map = {2160: "2160p (4K)", 1440: "1440p", 1080: "1080p",
                     720: "720p", 480: "480p", 360: "360p", 240: "240p", 144: "144p"}
        resolution = label_map.get(height, f"{height}p")
    elif fmt.get("resolution"):
        resolution = fmt["resolution"]

    # File size estimation: prefer exact, then approx, then calculate from bitrate
    filesize = fmt.get("filesize")
    filesize_approx = fmt.get("filesize_approx")
    if not filesize and not filesize_approx and duration:
        tbr = fmt.get("tbr")
        if tbr:
            # tbr is in kbps, duration in seconds → bytes
            filesize_approx = int(tbr * 1000 / 8 * duration)

    return FormatInfo(
        format_id=str(fmt.get("format_id", "unknown")),
        resolution=resolution,
        width=width,
        height=height,
        fps=fmt.get("fps"),
        vcodec=vcodec if has_video else None,
        acodec=acodec if has_audio else None,
        vbr=fmt.get("vbr"),
        abr=fmt.get("abr"),
        tbr=fmt.get("tbr"),
        container=fmt.get("ext"),
        filesize=filesize,
        filesize_approx=filesize_approx,
        has_audio=has_audio,
        has_video=has_video,
        dynamic_range=fmt.get("dynamic_range", "SDR") if has_video else None,
        sample_rate=fmt.get("asr"),
        audio_channels=fmt.get("audio_channels"),
        format_note=fmt.get("format_note"),
    )


def _format_duration(seconds: float | None) -> str | None:
    """Convert seconds to H:MM:SS or M:SS string."""
    if seconds is None:
        return None
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


# ─── Main Analysis ──────────────────────────────────────────────────────────

async def analyze_url(url: str) -> VideoMetadata:
    """
    Analyze a video URL and return metadata + all available formats.
    Uses yt-dlp's extract_info with download=False.
    """
    validated_url = validate_url(url)

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        # Don't write anything to disk
        "writeinfojson": False,
        "writethumbnail": False,
        "extract_flat": False,
    }

    if settings.cookie_file:
        ydl_opts["cookiefile"] = settings.cookie_file
    elif settings.cookies_from_browser:
        ydl_opts["cookiesfrombrowser"] = (settings.cookies_from_browser,)

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(validated_url, download=False)

        if info is None:
            raise ValueError("Could not extract video information")

        duration = info.get("duration")
        raw_formats = info.get("formats", [])

        # Parse all formats
        formats = []
        for fmt in raw_formats:
            try:
                parsed = _parse_format(fmt, duration)
                formats.append(parsed)
            except Exception as e:
                logger.warning(f"Skipping format {fmt.get('format_id')}: {e}")

        # Format the upload date for display (YYYYMMDD → YYYY-MM-DD)
        upload_date = info.get("upload_date")
        if upload_date and len(upload_date) == 8:
            upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"

        return VideoMetadata(
            title=info.get("title", "Unknown Title"),
            thumbnail=info.get("thumbnail"),
            duration=duration,
            duration_string=_format_duration(duration),
            uploader=info.get("uploader") or info.get("channel"),
            upload_date=upload_date,
            view_count=info.get("view_count"),
            description=info.get("description"),
            webpage_url=info.get("webpage_url"),
            extractor=info.get("extractor_key") or info.get("extractor"),
            formats=formats,
        )

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        # Clean up yt-dlp error messages for the user
        if "Unsupported URL" in error_msg:
            raise ValueError("This URL is not supported. Please provide a valid video URL.")
        if "Private video" in error_msg:
            raise ValueError("This video is private and cannot be accessed.")
        if "Video unavailable" in error_msg:
            raise ValueError("This video is unavailable.")
        raise ValueError(f"Failed to analyze URL: {error_msg}")
    except Exception as e:
        logger.error(f"URL analysis failed: {e}", exc_info=True)
        raise ValueError(f"Analysis failed: {str(e)}")
