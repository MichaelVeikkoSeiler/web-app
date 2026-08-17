"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ZoneGrid, type ZoneTile } from "@/components/zones/zone-grid";
import { Sheet } from "@/components/ui/sheet";
import { ZoneForm } from "@/components/zones/zone-form";

export function ZoneList({ zones }: { zones: ZoneTile[] }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-forest">Zonen</h1>
        <button
          onClick={() => setAddOpen(true)}
          aria-label="Zone hinzufügen"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-warm-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {zones.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
          Noch keine Zonen angelegt. Legt eure ~8 Gartenbereiche an, um Pflanzen
          zuordnen zu können.
        </p>
      ) : (
        <ZoneGrid zones={zones} />
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Zone anlegen">
        <ZoneForm onDone={() => setAddOpen(false)} />
      </Sheet>
    </div>
  );
}
