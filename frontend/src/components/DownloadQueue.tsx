/**
 * Superda — Download Queue Component
 * Panel showing all active and historical downloads.
 */

"use client";

import type { ActiveDownload } from "@/hooks/useDownload";
import DownloadProgress from "./DownloadProgress";

interface DownloadQueueProps {
  downloads: Map<string, ActiveDownload>;
  onCancel: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onResume: (taskId: string) => void;
  onSave: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  onClearCompleted: () => void;
}

export default function DownloadQueue({
  downloads,
  onCancel,
  onPause,
  onResume,
  onSave,
  onDismiss,
  onClearCompleted,
}: DownloadQueueProps) {
  const entries = Array.from(downloads.values());

  if (entries.length === 0) return null;

  const activeCount = entries.filter((d) =>
    ["pending", "downloading", "merging", "converting", "paused"].includes(d.progress.status)
  ).length;

  const completedCount = entries.filter((d) =>
    ["completed", "failed", "cancelled"].includes(d.progress.status)
  ).length;

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 animate-fade-in" id="download-queue">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-zinc-100">Downloads</h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/20">
              {activeCount} active
            </span>
          )}
        </div>

        {completedCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Download list */}
      <div className="space-y-3">
        {entries.map((dl) => (
          <DownloadProgress
            key={dl.taskId}
            progress={dl.progress}
            onCancel={() => onCancel(dl.taskId)}
            onPause={() => onPause(dl.taskId)}
            onResume={() => onResume(dl.taskId)}
            onSave={() => onSave(dl.taskId)}
            onDismiss={() => onDismiss(dl.taskId)}
          />
        ))}
      </div>
    </div>
  );
}
