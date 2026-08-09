"use client";

import { ZoneGrid, type ZoneTile } from "@/components/zones/zone-grid";

export function ZoneList({ zones }: { zones: ZoneTile[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-forest">Zonen</h1>

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
    </div>
  );
}
