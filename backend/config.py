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
    cookie_content: str | None = None

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

    @property
    def resolved_cookie_file(self) -> str | None:
        """Resolve the path to the cookies file, writing cookie_content to a temp file if provided."""
        if self.cookie_file:
            return self.cookie_file

        if self.cookie_content:
            import tempfile
            from pathlib import Path
            import logging

            logger = logging.getLogger("superda.config")

            # Use a safe path in the system temporary directory or downloads directory
            try:
                temp_dir = Path(tempfile.gettempdir())
                cookie_path = temp_dir / "superda_cookies.txt"
            except Exception:
                # Fallback to download path if temp dir lookup fails
                cookie_path = self.download_path / "superda_cookies.txt"

            try:
                # Clean and format cookie content (handles escaped newlines/tabs from environment copy-pastes)
                content = self.cookie_content.strip()
                if "\\n" in content:
                    content = content.replace("\\n", "\n")
                if "\\t" in content:
                    content = content.replace("\\t", "\t")

                # Write/overwrite only if the file doesn't exist or is empty
                if not cookie_path.exists() or cookie_path.stat().st_size == 0:
                    cookie_path.parent.mkdir(parents=True, exist_ok=True)
                    cookie_path.write_text(content, encoding="utf-8")
                    logger.info(f"Successfully wrote cookies from environment variable to {cookie_path}")
                return str(cookie_path)
            except Exception as e:
                logger.error(f"Failed to write cookie file to {cookie_path}: {e}")

        return None

    model_config = {
        "env_file": os.path.join(os.path.dirname(__file__), ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton instance
settings = Settings()
