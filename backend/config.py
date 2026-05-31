"""
Superda Backend — Configuration
Pydantic Settings model reading from .env file.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # --- Paths ---
    download_dir: str = "./downloads"
    ffmpeg_path: str = "ffmpeg"

    # --- Cookies ---
    cookies_from_browser: str | None = None
    cookie_file: str | None = None

    # --- Concurrency & Limits ---
    max_concurrent_downloads: int = 3
    max_file_age_minutes: int = 30
    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60

    # --- CORS ---
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def download_path(self) -> Path:
        """Resolve download directory to an absolute Path."""
        path = Path(self.download_dir).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def resolved_ffmpeg_path(self) -> str:
        """Resolve ffmpeg binary to an absolute path if found on system PATH."""
        import shutil
        resolved = shutil.which(self.ffmpeg_path)
        return resolved or self.ffmpeg_path

    model_config = {
        "env_file": os.path.join(os.path.dirname(__file__), ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton instance
settings = Settings()
