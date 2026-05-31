/**
 * Superda — Download Options Component
 * Quick download buttons and format selection controls.
 */

"use client";

import { useState } from "react";
import type { AudioFormat, VideoContainer, FormatInfo, DownloadRequest } from "@/lib/types";

interface DownloadOptionsProps {
  url: string;
  selectedFormat: FormatInfo | null;
  onDownload: (request: DownloadRequest) => void;
  disabled: boolean;
}

export default function DownloadOptions({
  url,
  selectedFormat,
  onDownload,
  disabled,
}: DownloadOptionsProps) {
  const [audioFormat, setAudioFormat] = useState<AudioFormat>("mp3");
  const [videoContainer, setVideoContainer] = useState<VideoContainer>("mp4");

  const quickActions = [
    {
      label: "Best Quality",
      sublabel: "Video + Audio",
      icon: "⬆",
      gradient: "from-violet-600 to-fuchsia-600",
      shadow: "shadow-violet-500/20",
      request: { url, best_quality: true, video_container: videoContainer } as DownloadRequest,
    },
    {
      label: "Smallest File",
      sublabel: "Lowest quality",
      icon: "⬇",
      gradient: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/20",
      request: { url, smallest_file: true } as DownloadRequest,
    },
    {
      label: "Best Audio",
      sublabel: audioFormat.toUpperCase(),
      icon: "♫",
      gradient: "from-amber-600 to-orange-600",
      shadow: "shadow-amber-500/20",
      request: { url, best_audio: true, audio_only: true, audio_format: audioFormat } as DownloadRequest,
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 animate-fade-in space-y-6" id="download-options">
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Quick Download</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onDownload(action.request)}
              disabled={disabled}
              className={`
                relative overflow-hidden rounded-xl p-4 text-left
                bg-gradient-to-br ${action.gradient}
                hover:brightness-110 active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg ${action.shadow}
                group
              `}
            >
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <p className="font-semibold text-white text-sm">{action.label}</p>
                <p className="text-white/60 text-xs mt-0.5">{action.sublabel}</p>
              </div>
              {/* Hover glow */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Format Options Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Audio Format Selector */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Audio Format
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["mp3", "m4a", "wav", "flac", "original"] as AudioFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setAudioFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  audioFormat === fmt
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-white/5 text-zinc-500 border border-white/5 hover:bg-white/10 hover:text-zinc-300"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Video Container Selector */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Video Container
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["mp4", "mkv", "webm", "original"] as VideoContainer[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setVideoContainer(fmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  videoContainer === fmt
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-white/5 text-zinc-500 border border-white/5 hover:bg-white/10 hover:text-zinc-300"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Format Download */}
      {selectedFormat && (
        <div className="border-t border-white/5 pt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Selected: <span className="font-mono text-violet-400">{selectedFormat.format_id}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {selectedFormat.resolution || "Audio"} · {selectedFormat.container?.toUpperCase()}
                {selectedFormat.vcodec ? ` · ${selectedFormat.vcodec}` : ""}
                {selectedFormat.acodec ? ` · ${selectedFormat.acodec}` : ""}
              </p>
            </div>

            <div className="flex gap-2">
              {selectedFormat.has_video && (
                <button
                  onClick={() =>
                    onDownload({
                      url,
                      format_id: selectedFormat.format_id,
                      video_container: videoContainer,
                    })
                  }
                  disabled={disabled}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-all duration-200 active:scale-95"
                >
                  Download Video
                </button>
              )}
              {selectedFormat.has_video && !selectedFormat.has_audio && (
                <button
                  onClick={() =>
                    onDownload({
                      url,
                      format_id: `${selectedFormat.format_id}+bestaudio`,
                      video_container: videoContainer,
                    })
                  }
                  disabled={disabled}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-40 transition-all duration-200 active:scale-95"
                >
                  + Merge Audio
                </button>
              )}
              {selectedFormat.has_audio && (
                <button
                  onClick={() =>
                    onDownload({
                      url,
                      format_id: selectedFormat.format_id,
                      audio_only: true,
                      audio_format: audioFormat,
                    })
                  }
                  disabled={disabled}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-all duration-200 active:scale-95"
                >
                  Extract Audio
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
