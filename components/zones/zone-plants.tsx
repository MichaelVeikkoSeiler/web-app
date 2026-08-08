"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { addZoneAssignment, removeZoneAssignment } from "@/lib/actions/plants";
import { selectClasses } from "@/components/ui/field";

export function ZonePlants({
  zoneId,
  assignedPlants,
  allPlants,
}: {
  zoneId: number;
  assignedPlants: { id: number; name: string }[];
  allPlants: { id: number; name: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const available = allPlants.filter((p) => !assignedPlants.some((ap) => ap.id === p.id));
  const [plantId, setPlantId] = useState<number | undefined>(undefined);
  const selectedPlantId = plantId ?? available[0]?.id;

  function handleRemove(id: number) {
    setRemovingId(id);
    startTransition(async () => {
      await removeZoneAssignment(id, zoneId);
      setRemovingId(null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
      {assignedPlants.length === 0 && !adding && (
        <span className="text-xs text-forest-muted">Noch keine Pflanzen zugeordnet.</span>
      )}

      {assignedPlants.map((p) => (
        <span
          key={p.id}
          className="flex items-center gap-1.5 rounded-full bg-bloom/40 py-1.5 pl-3 pr-1.5 text-sm text-bloom-text"
        >
          <Link href={`/pflanzen/${p.id}`} className="hover:underline">
            {p.name}
          </Link>
          <button
            aria-label={`${p.name} aus Zone entfernen`}
            disabled={pending && removingId === p.id}
            onClick={() => handleRemove(p.id)}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-bloom-text/20 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {available.length > 0 &&
        (adding ? (
          <div className="flex items-center gap-1.5">
            <select
              className={selectClasses + " min-h-9 py-1 text-sm"}
              value={selectedPlantId}
              onChange={(e) => setPlantId(Number(e.target.value))}
            >
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              disabled={pending}
              onClick={() =>
                selectedPlantId &&
                startTransition(async () => {
                  await addZoneAssignment(selectedPlantId, zoneId);
                  setPlantId(undefined);
                  setAdding(false);
                })
              }
              className="rounded-full bg-sage px-3 py-1.5 text-sm font-medium text-forest"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-forest-muted hover:border-sage hover:text-forest"
            aria-label="Pflanze dieser Zone zuordnen"
          >
            <Plus className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}
