"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addZoneAssignment, removeZoneAssignment } from "@/lib/actions/plants";
import { selectClasses } from "@/components/ui/field";

export function ZoneChips({
  plantId,
  assignedZones,
  allZones,
}: {
  plantId: number;
  assignedZones: { id: number; name: string }[];
  allZones: { id: number; name: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const available = allZones.filter((z) => !assignedZones.some((az) => az.id === z.id));
  const [zoneId, setZoneId] = useState<number | undefined>(undefined);
  const selectedZoneId = zoneId ?? available[0]?.id;

  function handleRemove(zoneId: number) {
    setRemovingId(zoneId);
    startTransition(async () => {
      await removeZoneAssignment(plantId, zoneId);
      setRemovingId(null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assignedZones.map((z) => (
        <span
          key={z.id}
          className="flex items-center gap-1.5 rounded-full bg-care/40 py-1.5 pl-3 pr-1.5 text-sm text-care-text"
        >
          {z.name}
          <button
            aria-label={`Zone ${z.name} entfernen`}
            disabled={pending && removingId === z.id}
            onClick={() => handleRemove(z.id)}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-care-text/20 disabled:opacity-50"
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
              value={selectedZoneId}
              onChange={(e) => setZoneId(Number(e.target.value))}
            >
              {available.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <button
              disabled={pending}
              onClick={() =>
                selectedZoneId &&
                startTransition(async () => {
                  await addZoneAssignment(plantId, selectedZoneId);
                  setZoneId(undefined);
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
            aria-label="Weitere Zone zuordnen"
          >
            <Plus className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}
