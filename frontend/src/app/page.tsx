/**
 * Superda — Main Page
 * Orchestrates all components: URL input → metadata → format table → download options → queue.
 */

"use client";

import { useState, useCallback } from "react";
import UrlInput from "@/components/UrlInput";
import VideoMetadata from "@/components/VideoMetadata";
import FormatTable from "@/components/FormatTable";
import DownloadOptions from "@/components/DownloadOptions";
import DownloadQueue from "@/components/DownloadQueue";
import Toast from "@/components/Toast";
import { MetadataSkeleton, FormatTableSkeleton } from "@/components/Skeleton";
import { useAnalyze } from "@/hooks/useAnalyze";
import { useDownload } from "@/hooks/useDownload";
import { useToast } from "@/hooks/useToast";
import type { FormatInfo, DownloadRequest } from "@/lib/types";

export default function HomePage() {
  const { metadata, isLoading, error, analyze } = useAnalyze();
  const { downloads, start, cancel, pause, resume, save, dismiss, clearCompleted } = useDownload();
  const { toasts, removeToast, success, error: toastError, info } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<FormatInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");

  const handleAnalyze = useCallback(
    (url: string) => {
      setCurrentUrl(url);
      setSelectedFormat(null);
      analyze(url);
    },
    [analyze]
  );

  const handleDownload = useCallback(
    async (request: DownloadRequest) => {
      try {
        info("Download Started", "Your download has been queued");
        const taskId = await start(request);
        // Scroll to the download queue
        setTimeout(() => {
          document.getElementById("download-queue")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        // The SSE progress hook will handle updates
      } catch (err) {
        toastError(
          "Download Failed",
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    },
    [start, info, toastError]
  );

  const handleSave = useCallback(
    (taskId: string) => {
      save(taskId);
      success("Download Ready", "Your file is being saved");
    },
    [save, success]
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl mx-auto space-y-8">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Hero: URL Input */}
      <section className="pt-8 md:pt-16 pb-4">
        <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} error={error} />
      </section>

      {/* Loading Skeletons */}
      {isLoading && (
        <section className="space-y-6">
          <MetadataSkeleton />
          <FormatTableSkeleton />
        </section>
      )}

      {/* Results */}
      {metadata && !isLoading && (
        <section className="space-y-6 animate-slide-up">
          {/* Video Metadata */}
          <VideoMetadata metadata={metadata} />

          {/* Download Options */}
          <DownloadOptions
            url={currentUrl}
            selectedFormat={selectedFormat}
            onDownload={handleDownload}
            disabled={false}
          />

          {/* Format Table */}
          <FormatTable
            formats={metadata.formats}
            onSelectFormat={setSelectedFormat}
            selectedFormatId={selectedFormat?.format_id ?? null}
          />
        </section>
      )}

      {/* Download Queue */}
      <DownloadQueue
        downloads={downloads}
        onCancel={cancel}
        onPause={pause}
        onResume={resume}
        onSave={handleSave}
        onDismiss={dismiss}
        onClearCompleted={clearCompleted}
      />
    </div>
  );
}
