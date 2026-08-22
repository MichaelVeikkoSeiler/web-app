"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  title,
  children,
  maxWidthClassName = "sm:max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Schliessen"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-warm-white p-6 shadow-xl sm:rounded-3xl ${maxWidthClassName}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-forest">{title}</h2>
          <button
            aria-label="Schliessen"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-forest-muted hover:bg-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
