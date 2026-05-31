/**
 * Superda — useToast Hook
 * Global toast notification state management.
 */

"use client";

import { useCallback, useState } from "react";
import type { ToastMessage } from "@/lib/types";

let _toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = `toast-${++_toastId}`;
      const newToast: ToastMessage = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, newToast.duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message, duration: 8000 }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message, duration: 7000 }),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, info, warning };
}
