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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
        {assignedZones.map((z) => (
          <div key={z.id} className="relative">
            <button
              aria-label={`Zone ${z.name} entfernen`}
              disabled={pending && removingId === z.id}
              onClick={() => handleRemove(z.id)}
              className="absolute right-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-warm-white/90 text-forest-muted shadow-sm hover:bg-warm-white disabled:opacity-50"
            >
              <X className="h-2.5 w-2.5" />
            </button>
            <Link href={`/zonen/${z.id}`} aria-label={z.name} title={z.name}>
              <span className="relative block aspect-square overflow-hidden rounded-lg border border-border bg-cream">
                {z.imageUrl ? (
                  <Image
                    src={z.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 20vw, 90px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-forest-muted/40">
                    <MapPin className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                )}
              </span>
            </Link>
          </div>
        ))}

        {!adding && available.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            aria-label="Weitere Zone zuordnen"
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-forest-muted hover:border-sage hover:text-forest"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-2">
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
      )}
    </div>
  );
}
