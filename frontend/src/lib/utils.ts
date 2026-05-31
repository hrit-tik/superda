/**
 * Superda — Utility Functions
 * Shared formatting and helper functions.
 */

/**
 * Format bytes into human-readable string (e.g., "15.3 MB").
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format bitrate in kbps to human-readable string.
 */
export function formatBitrate(kbps: number | null | undefined): string {
  if (kbps == null) return "—";
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} kbps`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format a date string from YYYY-MM-DD to localized display.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format view count with K/M suffixes.
 */
export function formatViews(count: number | null | undefined): string {
  if (count == null) return "—";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Get a color class for a resolution quality tier.
 */
export function getQualityColor(height: number | null): string {
  if (!height) return "text-zinc-400";
  if (height >= 2160) return "text-amber-400";   // 4K — gold
  if (height >= 1440) return "text-purple-400";   // 1440p — purple
  if (height >= 1080) return "text-blue-400";     // 1080p — blue
  if (height >= 720) return "text-green-400";     // 720p — green
  return "text-zinc-400";                         // lower
}

/**
 * Get a badge label for resolution.
 */
export function getQualityBadge(height: number | null): string | null {
  if (!height) return null;
  if (height >= 2160) return "4K";
  if (height >= 1440) return "QHD";
  if (height >= 1080) return "FHD";
  if (height >= 720) return "HD";
  return null;
}
