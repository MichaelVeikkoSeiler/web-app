"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ZoneForm } from "@/components/zones/zone-form";
import { ZoneGrid, type ZoneTile } from "@/components/zones/zone-grid";

export function ZoneList({ zones }: { zones: ZoneTile[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-forest">Zonen</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Neue Zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
          Noch keine Zonen angelegt. Legt eure ~8 Gartenbereiche an, um Pflanzen
          zuordnen zu können.
        </p>
      ) : (
        <>
          <p className="text-xs text-forest-muted">
            Zone antippen für Details, kurz gedrückt halten zum Umsortieren.
          </p>
          <ZoneGrid zones={zones} />
        </>
      )}

      <Sheet open={creating} onClose={() => setCreating(false)} title="Neue Zone">
        <ZoneForm onDone={() => setCreating(false)} />
      </Sheet>
    </div>
  );
}
