/**
 * Superda — TypeScript Type Definitions
 * Mirrors backend Pydantic models for full-stack type safety.
 */

// ─── Enums ─────────────────────────────────────────────────────────────────

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "merging"
  | "converting"
  | "completed"
  | "paused"
  | "cancelled"
  | "failed";

export type AudioFormat = "original" | "mp3" | "m4a" | "wav" | "flac";
export type VideoContainer = "original" | "mp4" | "mkv" | "webm";

// ─── Format & Metadata ────────────────────────────────────────────────────

export interface FormatInfo {
  format_id: string;
  resolution: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  vcodec: string | null;
  acodec: string | null;
  vbr: number | null;
  abr: number | null;
  tbr: number | null;
  container: string | null;
  filesize: number | null;
  filesize_approx: number | null;
  has_audio: boolean;
  has_video: boolean;
  dynamic_range: string | null;
  sample_rate: number | null;
  audio_channels: number | null;
  format_note: string | null;
}

export interface VideoMetadata {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  duration_string: string | null;
  uploader: string | null;
  upload_date: string | null;
  view_count: number | null;
  description: string | null;
  webpage_url: string | null;
  extractor: string | null;
  formats: FormatInfo[];
}

// ─── Download ─────────────────────────────────────────────────────────────

export interface DownloadRequest {
  url: string;
  format_id?: string | null;
  audio_only?: boolean;
  video_only?: boolean;
  audio_format?: AudioFormat;
  video_container?: VideoContainer;
  best_quality?: boolean;
  smallest_file?: boolean;
  best_audio?: boolean;
}

export interface DownloadProgress {
  task_id: string;
  status: DownloadStatus;
  progress: number;
  speed: string | null;
  eta: string | null;
  downloaded: string | null;
  total: string | null;
  filename: string | null;
  phase: string;
  error: string | null;
}

export interface DownloadTask {
  task_id: string;
  url: string;
  title: string | null;
  status: DownloadStatus;
  progress: number;
  filename: string | null;
  created_at: string;
  completed_at: string | null;
  filesize: number | null;
  error: string | null;
}

export interface TaskResponse {
  task_id: string;
  status: DownloadStatus;
  message: string;
}

// ─── UI State ─────────────────────────────────────────────────────────────

export type FormatFilter = "all" | "video_audio" | "video_only" | "audio_only";
export type SortField = "resolution" | "fps" | "vbr" | "abr" | "filesize" | "container";
export type SortDirection = "asc" | "desc";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}
