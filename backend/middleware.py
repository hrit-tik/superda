"""
Superda Backend — Middleware
Rate limiting and request logging.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter using a sliding window per IP.
    Limits are configured via settings.rate_limit_requests and settings.rate_limit_window_seconds.
    """

    def __init__(self, app):
        super().__init__(app)
        # IP → list of request timestamps
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._max_requests = settings.rate_limit_requests
        self._window = settings.rate_limit_window_seconds

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, respecting X-Forwarded-For for reverse proxies."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_rate_limited(self, client_ip: str) -> bool:
        """Check if a client IP has exceeded the rate limit."""
        now = time.time()
        window_start = now - self._window

        # Remove expired entries
        self._requests[client_ip] = [
            ts for ts in self._requests[client_ip] if ts > window_start
        ]

        if len(self._requests[client_ip]) >= self._max_requests:
            return True

        self._requests[client_ip].append(now)
        return False

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process the request, applying rate limits."""
        # Skip rate limiting for SSE progress endpoints and file downloads
        if "/progress" in request.url.path or "/file" in request.url.path:
            return await call_next(request)

        client_ip = self._get_client_ip(request)

        if self._is_rate_limited(client_ip):
            logger.warning(f"Rate limited: {client_ip} on {request.url.path}")
            return Response(
                content='{"detail": "Too many requests. Please try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(self._window)},
            )

        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs all incoming requests with timing information."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.time()
        response = await call_next(request)
        duration = (time.time() - start) * 1000  # ms

        # Only log API routes, skip static assets
        if request.url.path.startswith("/api"):
            logger.info(
                f"{request.method} {request.url.path} "
                f"→ {response.status_code} ({duration:.0f}ms)"
            )

        return response
