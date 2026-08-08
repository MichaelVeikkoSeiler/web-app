"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, X, Leaf } from "lucide-react";
import { addZoneAssignment, removeZoneAssignment } from "@/lib/actions/plants";
import { Sheet } from "@/components/ui/sheet";

export type ZonePlant = { id: number; name: string; photoUrl?: string | null };

export function ZonePlants({
  zoneId,
  assignedPlants,
  allPlants,
}: {
  zoneId: number;
  assignedPlants: ZonePlant[];
  allPlants: ZonePlant[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const available = allPlants.filter((p) => !assignedPlants.some((ap) => ap.id === p.id));

  function handleAdd(plantId: number) {
    setBusyId(plantId);
    startTransition(async () => {
      await addZoneAssignment(plantId, zoneId);
      setBusyId(null);
      setPickerOpen(false);
    });
  }

  function handleRemove(id: number) {
    setBusyId(id);
    startTransition(async () => {
      await removeZoneAssignment(id, zoneId);
      setBusyId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {assignedPlants.length === 0 && (
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
              disabled={pending && busyId === p.id}
              onClick={() => handleRemove(p.id)}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-bloom-text/20 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      {available.length > 0 && (
        <button
          onClick={() => setPickerOpen(true)}
          className="flex w-fit items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm font-medium text-forest-muted hover:border-sage hover:text-forest"
        >
          <Plus className="h-4 w-4" />
          Pflanze hinzufügen
        </button>
      )}

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pflanze hinzufügen">
        <div className="flex flex-col gap-1">
          {available.map((p) => (
            <button
              key={p.id}
              disabled={pending && busyId === p.id}
              onClick={() => handleAdd(p.id)}
              className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-cream disabled:opacity-50"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                {p.photoUrl ? (
                  <Image src={p.photoUrl} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-forest-muted/40">
                    <Leaf className="h-5 w-5" strokeWidth={1.25} />
                  </span>
                )}
              </span>
              <span className="text-sm font-medium text-forest">{p.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
