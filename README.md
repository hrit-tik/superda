# 🎬 Superda

**A production-ready video format analyzer and downloader** built with Next.js, FastAPI, yt-dlp, and FFmpeg.

Paste a video URL → analyze all available formats → download in your preferred quality and format.

---

## ✨ Features

- **URL Analysis** — Paste any video URL to see all available formats with full metadata
- **Format Table** — Sortable, searchable table showing resolution, codecs, bitrate, file size, dynamic range
- **Quick Downloads** — One-click best quality, smallest file, or best audio
- **Format Selection** — Choose exact format IDs, merge video+audio, extract audio
- **Audio Conversion** — Convert to MP3, M4A, WAV, or FLAC
- **Video Containers** — Download as MP4, MKV, or WebM
- **Real-time Progress** — Live progress bar, speed, ETA via Server-Sent Events
- **Download Queue** — Multiple simultaneous downloads with pause/resume/cancel
- **Dark Mode** — Premium glassmorphism UI with smooth animations
- **Mobile Responsive** — Works beautifully on all screen sizes
- **Security** — URL validation, rate limiting, path traversal protection, auto-cleanup

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.13, Pydantic v2 |
| Media | yt-dlp, FFmpeg |
| Progress | Server-Sent Events (SSE) |
| Deployment | Docker, Docker Compose, Nginx |

## 📁 Project Structure

```
superda/
├── backend/                 # FastAPI backend
│   ├── main.py              # App entry point
│   ├── config.py            # Settings from .env
│   ├── models.py            # Pydantic schemas
│   ├── middleware.py         # Rate limiting, logging
│   ├── routers/
│   │   ├── analyze.py       # POST /api/analyze
│   │   └── download.py      # Download CRUD endpoints
│   ├── services/
│   │   ├── analyzer.py      # yt-dlp URL analysis
│   │   ├── downloader.py    # Download orchestration
│   │   ├── file_manager.py  # Temp file lifecycle
│   │   └── progress.py      # SSE progress streaming
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx   # Root layout + SEO
│   │   │   ├── page.tsx     # Main page
│   │   │   └── globals.css  # Design system
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # API client, types, utils
│   ├── next.config.ts
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf           # Reverse proxy
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **FFmpeg** — [Download](https://ffmpeg.org/download.html) and add to PATH
- **yt-dlp** — Installed via pip with backend dependencies

### Local Development

**1. Clone and setup backend:**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

**2. Start the backend:**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**3. Start the frontend (new terminal):**

```bash
cd frontend
npm install    # only first time
npm run dev
```

**4. Open** [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

```bash
docker compose up --build
```

This starts:
- **Backend** on port 8000
- **Frontend** on port 3000
- **Nginx** reverse proxy on port 80

Access the app at [http://localhost](http://localhost).

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze URL, return metadata + formats |
| `POST` | `/api/download` | Start a download task |
| `GET` | `/api/download/{id}/progress` | SSE progress stream |
| `POST` | `/api/download/{id}/cancel` | Cancel download |
| `POST` | `/api/download/{id}/pause` | Pause download |
| `POST` | `/api/download/{id}/resume` | Resume download |
| `GET` | `/api/download/{id}/file` | Download completed file |
| `GET` | `/api/downloads` | List all tasks |
| `GET` | `/api/health` | Health check |

Full interactive docs at [http://localhost:8000/api/docs](http://localhost:8000/api/docs) (Swagger UI).

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOWNLOAD_DIR` | `./downloads` | Temp download directory |
| `MAX_CONCURRENT_DOWNLOADS` | `3` | Max parallel downloads |
| `MAX_FILE_AGE_MINUTES` | `30` | Auto-cleanup threshold |
| `RATE_LIMIT_REQUESTS` | `30` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit window |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `FFMPEG_PATH` | `ffmpeg` | Path to FFmpeg binary |

## 🔒 Security

- **No shell execution** — yt-dlp is used via Python API, never subprocess
- **Path traversal protection** — All file paths validated within download dir
- **Rate limiting** — Per-IP sliding window rate limiter
- **Auto-cleanup** — Temporary files deleted after 30 minutes
- **URL validation** — Regex + URL parsing rejects malformed input
- **CORS** — Strict origin allowlist
- **Streaming** — Files served via streaming response, never loaded fully into memory

## ⚖️ Legal

This tool is designed for downloading content you are **authorized** to download. It does not bypass DRM or circumvent access controls. Users are responsible for complying with applicable copyright laws and platform terms of service.

## 📜 License

MIT
