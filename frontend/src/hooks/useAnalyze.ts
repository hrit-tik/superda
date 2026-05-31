/**
 * Superda — useAnalyze Hook
 * Manages URL analysis state: loading, data, error.
 */

"use client";

import { useCallback, useState } from "react";
import { analyzeUrl, ApiError } from "@/lib/api";
import type { VideoMetadata } from "@/lib/types";

interface UseAnalyzeReturn {
  /** Analyzed video metadata, null until analysis completes */
  metadata: VideoMetadata | null;
  /** Whether analysis is currently in progress */
  isLoading: boolean;
  /** Error message from the last failed analysis */
  error: string | null;
  /** Trigger analysis for a URL */
  analyze: (url: string) => Promise<void>;
  /** Clear all analysis state */
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const data = await analyzeUrl(url);
      setMetadata(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMetadata(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return { metadata, isLoading, error, analyze, reset };
}
