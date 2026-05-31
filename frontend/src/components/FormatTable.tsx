/**
 * Superda — Format Table Component
 * Interactive, sortable, filterable table of all available video/audio formats.
 */

"use client";

import { useMemo, useState } from "react";
import type { FormatInfo, FormatFilter, SortField, SortDirection } from "@/lib/types";
import { formatBytes, formatBitrate, getQualityColor, getQualityBadge } from "@/lib/utils";

interface FormatTableProps {
  formats: FormatInfo[];
  onSelectFormat: (format: FormatInfo) => void;
  selectedFormatId: string | null;
}

export default function FormatTable({
  formats,
  onSelectFormat,
  selectedFormatId,
}: FormatTableProps) {
  const [filter, setFilter] = useState<FormatFilter>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("resolution");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Filter formats
  const filtered = useMemo(() => {
    let result = formats;

    switch (filter) {
      case "video_audio":
        result = result.filter((f) => f.has_video && f.has_audio);
        break;
      case "video_only":
        result = result.filter((f) => f.has_video && !f.has_audio);
        break;
      case "audio_only":
        result = result.filter((f) => !f.has_video && f.has_audio);
        break;
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.format_id.toLowerCase().includes(q) ||
          f.resolution?.toLowerCase().includes(q) ||
          f.vcodec?.toLowerCase().includes(q) ||
          f.acodec?.toLowerCase().includes(q) ||
          f.container?.toLowerCase().includes(q) ||
          f.format_note?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [formats, filter, search]);

  // Sort formats
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "desc" ? -1 : 1;

    arr.sort((a, b) => {
      let aVal: number = 0;
      let bVal: number = 0;

      switch (sortField) {
        case "resolution":
          aVal = a.height || 0;
          bVal = b.height || 0;
          break;
        case "fps":
          aVal = a.fps || 0;
          bVal = b.fps || 0;
          break;
        case "vbr":
          aVal = a.vbr || a.tbr || 0;
          bVal = b.vbr || b.tbr || 0;
          break;
        case "abr":
          aVal = a.abr || 0;
          bVal = b.abr || 0;
          break;
        case "filesize":
          aVal = a.filesize || a.filesize_approx || 0;
          bVal = b.filesize || b.filesize_approx || 0;
          break;
        case "container":
          return dir * (a.container || "").localeCompare(b.container || "");
      }

      return dir * (aVal - bVal);
    });

    return arr;
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <span className="text-zinc-700 ml-1">↕</span>;
    return <span className="text-violet-400 ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  const filterTabs: { key: FormatFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: formats.length },
    { key: "video_audio", label: "Video + Audio", count: formats.filter((f) => f.has_video && f.has_audio).length },
    { key: "video_only", label: "Video Only", count: formats.filter((f) => f.has_video && !f.has_audio).length },
    { key: "audio_only", label: "Audio Only", count: formats.filter((f) => !f.has_video && f.has_audio).length },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 animate-fade-in" id="format-table">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <h3 className="text-lg font-bold text-zinc-100">Available Formats</h3>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search formats..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-violet-500/40 transition-colors"
            id="format-search"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              filter === tab.key
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "bg-white/5 text-zinc-500 border border-white/5 hover:bg-white/10 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
        <table className="w-full text-sm" id="formats-data-table">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="text-left py-3 pr-3 font-medium">ID</th>
              <th
                className="text-left py-3 px-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none"
                onClick={() => handleSort("resolution")}
              >
                Resolution <SortIcon field="resolution" />
              </th>
              <th
                className="text-left py-3 px-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none"
                onClick={() => handleSort("fps")}
              >
                FPS <SortIcon field="fps" />
              </th>
              <th className="text-left py-3 px-3 font-medium">Video Codec</th>
              <th className="text-left py-3 px-3 font-medium">Audio Codec</th>
              <th
                className="text-right py-3 px-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none"
                onClick={() => handleSort("vbr")}
              >
                Bitrate <SortIcon field="vbr" />
              </th>
              <th
                className="text-left py-3 px-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none"
                onClick={() => handleSort("container")}
              >
                Container <SortIcon field="container" />
              </th>
              <th
                className="text-right py-3 px-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none"
                onClick={() => handleSort("filesize")}
              >
                Size <SortIcon field="filesize" />
              </th>
              <th className="text-center py-3 px-3 font-medium">Audio</th>
              <th className="text-left py-3 pl-3 font-medium">DR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((fmt) => {
              const isSelected = fmt.format_id === selectedFormatId;
              const size = fmt.filesize || fmt.filesize_approx;

              return (
                <tr
                  key={fmt.format_id}
                  onClick={() => onSelectFormat(fmt)}
                  className={`
                    border-b border-white/[0.03] cursor-pointer transition-all duration-150
                    ${isSelected
                      ? "bg-violet-500/10 border-violet-500/20"
                      : "hover:bg-white/[0.03]"}
                  `}
                >
                  {/* Format ID */}
                  <td className="py-3 pr-3">
                    <span className="text-xs font-mono text-zinc-600">{fmt.format_id}</span>
                  </td>

                  {/* Resolution */}
                  <td className="py-3 px-3">
                    {fmt.has_video ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getQualityColor(fmt.height)}`}>
                          {fmt.resolution || "—"}
                        </span>
                        {getQualityBadge(fmt.height) && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            fmt.height && fmt.height >= 2160
                              ? "bg-amber-500/15 text-amber-400"
                              : fmt.height && fmt.height >= 1080
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-zinc-500/15 text-zinc-400"
                          }`}>
                            {getQualityBadge(fmt.height)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600 italic">audio</span>
                    )}
                  </td>

                  {/* FPS */}
                  <td className="py-3 px-3 text-zinc-400">
                    {fmt.fps ? `${fmt.fps}` : "—"}
                  </td>

                  {/* Video Codec */}
                  <td className="py-3 px-3">
                    <span className="text-zinc-400 font-mono text-xs">
                      {fmt.vcodec || "—"}
                    </span>
                  </td>

                  {/* Audio Codec */}
                  <td className="py-3 px-3">
                    <span className="text-zinc-400 font-mono text-xs">
                      {fmt.acodec || "—"}
                    </span>
                  </td>

                  {/* Bitrate */}
                  <td className="py-3 px-3 text-right text-zinc-400">
                    <div className="space-y-0.5">
                      {fmt.vbr ? (
                        <div className="text-xs">
                          <span className="text-zinc-600">V:</span> {formatBitrate(fmt.vbr)}
                        </div>
                      ) : null}
                      {fmt.abr ? (
                        <div className="text-xs">
                          <span className="text-zinc-600">A:</span> {formatBitrate(fmt.abr)}
                        </div>
                      ) : null}
                      {!fmt.vbr && !fmt.abr && fmt.tbr ? (
                        <div className="text-xs">{formatBitrate(fmt.tbr)}</div>
                      ) : null}
                      {!fmt.vbr && !fmt.abr && !fmt.tbr && "—"}
                    </div>
                  </td>

                  {/* Container */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-400 text-xs font-medium uppercase">
                      {fmt.container || "—"}
                    </span>
                  </td>

                  {/* File Size */}
                  <td className="py-3 px-3 text-right">
                    <span className={`text-xs font-medium ${size ? "text-zinc-300" : "text-zinc-600"}`}>
                      {formatBytes(size)}
                      {!fmt.filesize && fmt.filesize_approx ? (
                        <span className="text-zinc-700 ml-0.5" title="Estimated">~</span>
                      ) : null}
                    </span>
                  </td>

                  {/* Has Audio */}
                  <td className="py-3 px-3 text-center">
                    {fmt.has_audio ? (
                      <span className="text-emerald-400 text-xs">✓</span>
                    ) : (
                      <span className="text-zinc-700 text-xs">✕</span>
                    )}
                  </td>

                  {/* Dynamic Range */}
                  <td className="py-3 pl-3">
                    {fmt.dynamic_range && fmt.dynamic_range !== "SDR" ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">
                        {fmt.dynamic_range}
                      </span>
                    ) : fmt.has_video ? (
                      <span className="text-zinc-700 text-xs">SDR</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            No formats match your search
          </div>
        )}
      </div>

      {/* Count */}
      <div className="mt-4 text-xs text-zinc-600">
        Showing {sorted.length} of {formats.length} formats
      </div>
    </div>
  );
}
