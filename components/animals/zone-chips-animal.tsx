"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, X, MapPin } from "lucide-react";
import { addZoneAssignmentsAnimal, removeZoneAssignmentAnimal } from "@/lib/actions/animals";
import { Button } from "@/components/ui/button";
import { ZoneMultiSelect } from "@/components/zones/zone-multi-select";

type Zone = { id: number; name: string; imageUrl: string | null };

export function ZoneChipsAnimal({
  animalId,
  assignedZones,
  allZones,
}: {
  animalId: number;
  assignedZones: Zone[];
  allZones: Zone[];
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const available = allZones.filter((z) => !assignedZones.some((az) => az.id === z.id));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleZone(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRemove(zoneId: number) {
    setRemovingId(zoneId);
    startTransition(async () => {
      await removeZoneAssignmentAnimal(animalId, zoneId);
      setRemovingId(null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assignedZones.map((z) => (
        <span
          key={z.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-warm-white py-1.5 pl-1.5 pr-2"
        >
          <Link href={`/zonen/${z.id}`} className="flex items-center gap-2">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-cream">
              {z.imageUrl ? (
                <Image src={z.imageUrl} alt="" fill sizes="36px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-forest-muted/40">
                  <MapPin className="h-4 w-4" strokeWidth={1.5} />
                </span>
              )}
            </span>
            <span className="text-sm text-forest hover:underline">{z.name}</span>
          </Link>
          <button
            aria-label={`Zone ${z.name} entfernen`}
            disabled={pending && removingId === z.id}
            onClick={() => handleRemove(z.id)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-forest-muted hover:bg-cream disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {available.length > 0 &&
        (adding ? (
          <div className="flex w-full flex-col gap-2">
            <ZoneMultiSelect zones={available} selected={selectedIds} onToggle={toggleZone} />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setSelectedIds(new Set());
                  setAdding(false);
                }}
              >
                Abbrechen
              </Button>
              <Button
                className="flex-1"
                disabled={pending || selectedIds.size === 0}
                onClick={() =>
                  startTransition(async () => {
                    await addZoneAssignmentsAnimal(animalId, [...selectedIds]);
                    setSelectedIds(new Set());
                    setAdding(false);
                  })
                }
              >
                Hinzufügen
              </Button>
            </div>
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
