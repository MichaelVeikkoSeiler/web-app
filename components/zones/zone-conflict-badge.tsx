"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

export function ZoneConflictBadge({
  label,
  text,
}: {
  label: string;
  text: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-attention/40 px-2.5 py-1 text-xs font-medium text-attention-text hover:bg-attention/60"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Konflikt: {label}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`Konflikt: ${label}`}>
        <p className="text-sm leading-relaxed text-forest-muted">
          {text || "Keine weiteren Details verfügbar."}
        </p>
      </Sheet>
    </>
  );
}
