/**
 * Superda — Download Progress Component
 * Per-download progress card with animated bar, speed, ETA, and control buttons.
 */

"use client";

import type { DownloadProgress as ProgressType } from "@/lib/types";

interface DownloadProgressProps {
  progress: ProgressType;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: "text-zinc-400", bgColor: "bg-zinc-500", label: "Pending" },
  downloading: { color: "text-blue-400", bgColor: "bg-blue-500", label: "Downloading" },
  merging: { color: "text-purple-400", bgColor: "bg-purple-500", label: "Merging" },
  converting: { color: "text-fuchsia-400", bgColor: "bg-fuchsia-500", label: "Converting" },
  completed: { color: "text-emerald-400", bgColor: "bg-emerald-500", label: "Completed" },
  paused: { color: "text-amber-400", bgColor: "bg-amber-500", label: "Paused" },
  cancelled: { color: "text-zinc-500", bgColor: "bg-zinc-600", label: "Cancelled" },
  failed: { color: "text-red-400", bgColor: "bg-red-500", label: "Failed" },
};

export default function DownloadProgress({
  progress,
  onCancel,
  onPause,
  onResume,
  onSave,
  onDismiss,
}: DownloadProgressProps) {
  const config = statusConfig[progress.status] || statusConfig.pending;
  const isActive = ["pending", "downloading", "merging", "converting"].includes(progress.status);
  const isPaused = progress.status === "paused";
  const isDone = progress.status === "completed";
  const isTerminal = ["completed", "failed", "cancelled"].includes(progress.status);

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {progress.filename || "Starting download..."}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            {progress.phase && progress.phase !== progress.status && (
              <span className="text-xs text-zinc-600">· {progress.phase}</span>
            )}
          </div>
        </div>

        {/* Dismiss button for terminal states */}
        {isTerminal && (
          <button
            onClick={onDismiss}
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${config.bgColor} ${
            isActive && progress.status !== "pending" ? "animate-progress-glow" : ""
          }`}
          style={{ width: `${Math.min(progress.progress, 100)}%` }}
        />
        {/* Shimmer effect for active downloads */}
        {isActive && progress.progress > 0 && progress.progress < 100 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{ width: `${progress.progress}%` }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="font-medium text-zinc-300">{progress.progress.toFixed(1)}%</span>
          {progress.downloaded && (
            <span>{progress.downloaded}{progress.total ? ` / ${progress.total}` : ""}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {progress.speed && <span>{progress.speed}</span>}
          {progress.eta && <span>ETA: {progress.eta}</span>}
        </div>
      </div>

      {/* Error message */}
      {progress.error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {progress.error}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isActive && (
          <>
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-white/5 transition-all duration-200"
            >
              Pause
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
            >
              Cancel
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={onResume}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200"
            >
              Resume
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
            >
              Cancel
            </button>
          </>
        )}

        {isDone && (
          <button
            onClick={onSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 transition-all duration-200 active:scale-95 shadow-lg shadow-violet-500/20"
          >
            💾 Save File
          </button>
        )}
      </div>
    </div>
  );
}
