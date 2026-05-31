/**
 * Superda — API Client
 * Typed API client for communicating with the FastAPI backend.
 */

import type {
  DownloadProgress,
  DownloadRequest,
  DownloadTask,
  TaskResponse,
  VideoMetadata,
} from "./types";

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" && window.location.port === "3000") {
      return "http://localhost:8000/api";
    }
  }
  return "/api";
};

const API_BASE = getApiBase();

// ─── Error Handling ────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // Use default message
    }
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * Analyze a video URL and return metadata with all available formats.
 */
export async function analyzeUrl(url: string): Promise<VideoMetadata> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return handleResponse<VideoMetadata>(response);
}

/**
 * Start a new download task.
 */
export async function startDownload(request: DownloadRequest): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<TaskResponse>(response);
}

/**
 * Cancel a download task.
 */
export async function cancelDownload(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/download/${taskId}/cancel`, {
    method: "POST",
  });
  return handleResponse<TaskResponse>(response);
}

/**
 * Pause a download task.
 */
export async function pauseDownload(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/download/${taskId}/pause`, {
    method: "POST",
  });
  return handleResponse<TaskResponse>(response);
}

/**
 * Resume a paused download task.
 */
export async function resumeDownload(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/download/${taskId}/resume`, {
    method: "POST",
  });
  return handleResponse<TaskResponse>(response);
}

/**
 * List all download tasks.
 */
export async function getDownloads(): Promise<DownloadTask[]> {
  const response = await fetch(`${API_BASE}/downloads`);
  return handleResponse<DownloadTask[]>(response);
}

/**
 * Trigger browser download of a completed file.
 */
export function downloadFile(taskId: string): void {
  const url = `${API_BASE}/download/${taskId}/file`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── SSE Progress Stream ──────────────────────────────────────────────────

/**
 * Subscribe to real-time download progress via Server-Sent Events.
 * Returns a cleanup function to close the connection.
 */
export function subscribeToProgress(
  taskId: string,
  onProgress: (progress: DownloadProgress) => void,
  onDone?: (progress: DownloadProgress) => void,
  onError?: (error: Event) => void
): () => void {
  const url = `${API_BASE}/download/${taskId}/progress`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener("progress", (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as DownloadProgress;
      onProgress(data);
    } catch (e) {
      console.error("Failed to parse progress event:", e);
    }
  });

  eventSource.addEventListener("done", (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as DownloadProgress;
      onDone?.(data);
    } catch (e) {
      console.error("Failed to parse done event:", e);
    }
    eventSource.close();
  });

  eventSource.onerror = (event) => {
    onError?.(event);
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}
