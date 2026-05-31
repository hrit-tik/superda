/**
 * Superda — useDownload Hook
 * Manages download lifecycle: start, progress tracking via SSE, pause/resume/cancel.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelDownload,
  downloadFile,
  pauseDownload,
  resumeDownload,
  startDownload,
  subscribeToProgress,
  ApiError,
} from "@/lib/api";
import type { DownloadProgress, DownloadRequest } from "@/lib/types";

export interface ActiveDownload {
  taskId: string;
  progress: DownloadProgress;
  cleanup: () => void;
}

interface UseDownloadReturn {
  /** Map of active downloads by task ID */
  downloads: Map<string, ActiveDownload>;
  /** Start a new download and begin tracking its progress */
  start: (request: DownloadRequest) => Promise<string>;
  /** Cancel a download */
  cancel: (taskId: string) => Promise<void>;
  /** Pause a download */
  pause: (taskId: string) => Promise<void>;
  /** Resume a paused download */
  resume: (taskId: string) => Promise<void>;
  /** Trigger browser download of completed file */
  save: (taskId: string) => void;
  /** Remove a completed/failed/cancelled download from the list */
  dismiss: (taskId: string) => void;
  /** Clear all completed downloads */
  clearCompleted: () => void;
}

export function useDownload(): UseDownloadReturn {
  const [downloads, setDownloads] = useState<Map<string, ActiveDownload>>(new Map());
  const downloadsRef = useRef(downloads);
  downloadsRef.current = downloads;

  // Clean up all SSE connections on unmount
  useEffect(() => {
    return () => {
      downloadsRef.current.forEach((dl) => dl.cleanup());
    };
  }, []);

  const start = useCallback(async (request: DownloadRequest): Promise<string> => {
    const response = await startDownload(request);
    const taskId = response.task_id;

    // Subscribe to SSE progress
    const cleanup = subscribeToProgress(
      taskId,
      // onProgress
      (progress) => {
        setDownloads((prev) => {
          const next = new Map(prev);
          const existing = next.get(taskId);
          if (existing) {
            next.set(taskId, { ...existing, progress });
          }
          return next;
        });
      },
      // onDone
      (progress) => {
        setDownloads((prev) => {
          const next = new Map(prev);
          const existing = next.get(taskId);
          if (existing) {
            next.set(taskId, { ...existing, progress, cleanup: () => {} });
          }
          return next;
        });
      },
      // onError
      () => {
        setDownloads((prev) => {
          const next = new Map(prev);
          const existing = next.get(taskId);
          if (existing) {
            next.set(taskId, {
              ...existing,
              progress: {
                ...existing.progress,
                status: "failed",
                error: "Connection lost",
                phase: "error",
              },
              cleanup: () => {},
            });
          }
          return next;
        });
      }
    );

    const initialProgress: DownloadProgress = {
      task_id: taskId,
      status: "pending",
      progress: 0,
      speed: null,
      eta: null,
      downloaded: null,
      total: null,
      filename: null,
      phase: "starting",
      error: null,
    };

    setDownloads((prev) => {
      const next = new Map(prev);
      next.set(taskId, { taskId, progress: initialProgress, cleanup });
      return next;
    });

    return taskId;
  }, []);

  const cancel = useCallback(async (taskId: string) => {
    try {
      await cancelDownload(taskId);
      const dl = downloadsRef.current.get(taskId);
      if (dl) dl.cleanup();
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  }, []);

  const pause = useCallback(async (taskId: string) => {
    try {
      await pauseDownload(taskId);
    } catch (err) {
      console.error("Pause failed:", err);
    }
  }, []);

  const resume = useCallback(async (taskId: string) => {
    try {
      await resumeDownload(taskId);
    } catch (err) {
      console.error("Resume failed:", err);
    }
  }, []);

  const save = useCallback((taskId: string) => {
    downloadFile(taskId);
  }, []);

  const dismiss = useCallback((taskId: string) => {
    const dl = downloadsRef.current.get(taskId);
    if (dl) dl.cleanup();
    setDownloads((prev) => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setDownloads((prev) => {
      const next = new Map(prev);
      for (const [id, dl] of next) {
        if (["completed", "failed", "cancelled"].includes(dl.progress.status)) {
          dl.cleanup();
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  return { downloads, start, cancel, pause, resume, save, dismiss, clearCompleted };
}
