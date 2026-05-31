/**
 * Superda — Toast Notification Component
 * Animated toast notifications with auto-dismiss and type variants.
 */

"use client";

import { useEffect, useState } from "react";
import type { ToastMessage } from "@/lib/types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const icons: Record<ToastMessage["type"], string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const colors: Record<ToastMessage["type"], string> = {
  success: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  error: "from-red-500/20 to-red-500/5 border-red-500/30",
  info: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  warning: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
};

const iconColors: Record<ToastMessage["type"], string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  error: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-amber-500/20 text-amber-400",
};

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
        bg-gradient-to-r ${colors[toast.type]}
        shadow-2xl shadow-black/20
        transition-all duration-300 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        max-w-sm w-full
      `}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold shrink-0 ${iconColors[toast.type]}`}
      >
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" id="toast-container">
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
