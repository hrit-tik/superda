/**
 * Superda — Video Metadata Component
 * Displays video info card with thumbnail, title, uploader, duration, and date.
 */

"use client";

import type { VideoMetadata as VideoMetadataType } from "@/lib/types";
import { formatDuration, formatDate, formatViews } from "@/lib/utils";

interface VideoMetadataProps {
  metadata: VideoMetadataType;
}

export default function VideoMetadata({ metadata }: VideoMetadataProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in" id="video-metadata">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        {metadata.thumbnail && (
          <div className="relative md:w-80 shrink-0 overflow-hidden">
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover min-h-[180px] md:min-h-full"
              loading="lazy"
            />
            {/* Duration badge */}
            {metadata.duration_string && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-semibold bg-black/80 text-white rounded-md backdrop-blur-sm">
                {metadata.duration_string}
              </span>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 p-5 md:p-6 space-y-3">
          <h2 className="text-xl font-bold text-zinc-100 leading-tight line-clamp-2">
            {metadata.title}
          </h2>

          {metadata.uploader && (
            <p className="text-sm text-zinc-400 font-medium">
              {metadata.uploader}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
            {metadata.upload_date && (
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDate(metadata.upload_date)}
              </span>
            )}

            {metadata.duration != null && (
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatDuration(metadata.duration)}
              </span>
            )}

            {metadata.view_count != null && (
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {formatViews(metadata.view_count)}
              </span>
            )}

            {metadata.extractor && (
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                {metadata.extractor}
              </span>
            )}
          </div>

          {/* Format count summary */}
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-zinc-500">
              <span className="text-zinc-300 font-semibold">{metadata.formats.length}</span> formats available
              {" · "}
              <span className="text-zinc-300 font-semibold">
                {metadata.formats.filter(f => f.has_video && f.has_audio).length}
              </span> with audio
              {" · "}
              <span className="text-zinc-300 font-semibold">
                {metadata.formats.filter(f => !f.has_video && f.has_audio).length}
              </span> audio-only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
