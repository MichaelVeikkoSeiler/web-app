"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ZoneForm } from "@/components/zones/zone-form";
import { ZoneReorderList, type Zone } from "@/components/zones/zone-reorder-list";

export function ZoneList({
  zones,
  allPlants,
}: {
  zones: Zone[];
  allPlants: { id: number; name: string }[];
}) {
  const [sheetZone, setSheetZone] = useState<Zone | "new" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-forest">Zonen</h1>
        <Button onClick={() => setSheetZone("new")}>
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
            Zum Umsortieren eine Zone kurz gedrückt halten und verschieben.
          </p>
          <ZoneReorderList zones={zones} allPlants={allPlants} onEdit={setSheetZone} />
        </>
      )}

      <Sheet
        open={sheetZone !== null}
        onClose={() => setSheetZone(null)}
        title={sheetZone === "new" ? "Neue Zone" : "Zone bearbeiten"}
      >
        <ZoneForm
          zone={sheetZone && sheetZone !== "new" ? sheetZone : undefined}
          onDone={() => setSheetZone(null)}
        />
      </Sheet>
    </div>
  );
}
