/**
 * Superda — URL Input Component
 * Premium hero-style URL input with paste button, validation, and loading animation.
 */

"use client";

import { useState, useRef, useEffect } from "react";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function UrlInput({ onAnalyze, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onAnalyze(trimmed);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        // Auto-analyze on paste
        if (text.trim().startsWith("http")) {
          onAnalyze(text.trim());
        }
      }
    } catch {
      // Clipboard access denied — user can paste manually
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto" id="url-input-section">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            superda
          </span>
        </h1>
        <p className="text-zinc-400 text-lg">
          Paste a video URL to analyze and download all available formats
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass-card rounded-2xl p-1.5 group focus-within:border-violet-500/40 transition-colors duration-300">
          <div className="flex items-center gap-2">
            {/* Search icon */}
            <div className="pl-4 text-zinc-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-base py-3.5 px-2 outline-none"
              disabled={isLoading}
              id="url-input"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Paste button */}
            <button
              type="button"
              onClick={handlePaste}
              className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 
                         bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200
                         border border-white/5 hover:border-white/10"
              disabled={isLoading}
              title="Paste from clipboard"
              id="paste-button"
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Paste
              </span>
            </button>

            {/* Convert button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-violet-600 to-fuchsia-600 
                         hover:from-violet-500 hover:to-fuchsia-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-white shadow-lg shadow-violet-500/20
                         transition-all duration-200 hover:shadow-violet-500/30
                         active:scale-95"
              id="analyze-button"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Converting
                </span>
              ) : (
                "Convert"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in" id="error-message">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Supported sites hint */}
      <p className="text-center text-zinc-600 text-xs mt-4">
        Supports YouTube, Vimeo, Twitter/X, Reddit, and{" "}
        <a
          href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2"
        >
          1000+ other sites
        </a>
      </p>
    </div>
  );
}
