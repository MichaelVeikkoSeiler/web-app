"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, X, PawPrint } from "lucide-react";
import { addZoneAssignmentsAnimal, removeZoneAssignmentAnimal } from "@/lib/actions/animals";
import { Sheet } from "@/components/ui/sheet";

export type ZoneAnimal = { id: number; name: string; photoUrl?: string | null };

export function ZoneAnimals({
  zoneId,
  assignedAnimals,
  allAnimals,
}: {
  zoneId: number;
  assignedAnimals: ZoneAnimal[];
  allAnimals: ZoneAnimal[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<"choice" | "existing">("choice");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const available = allAnimals.filter((a) => !assignedAnimals.some((aa) => aa.id === a.id));

  function openPicker() {
    setMode("choice");
    setPickerOpen(true);
  }

  function handleAdd(animalId: number) {
    setBusyId(animalId);
    startTransition(async () => {
      await addZoneAssignmentsAnimal(animalId, [zoneId]);
      setBusyId(null);
      setPickerOpen(false);
    });
  }

  function handleRemove(id: number) {
    setBusyId(id);
    startTransition(async () => {
      await removeZoneAssignmentAnimal(id, zoneId);
      setBusyId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {assignedAnimals.length === 0 && (
        <span className="text-xs text-forest-muted">Noch keine Tiere zugeordnet.</span>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {assignedAnimals.map((a) => (
          <div key={a.id} className="relative flex flex-col gap-2">
            <button
              aria-label={`${a.name} aus Zone entfernen`}
              disabled={pending && busyId === a.id}
              onClick={() => handleRemove(a.id)}
              className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-warm-white/90 text-forest-muted shadow-sm hover:bg-warm-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <Link href={`/tiere/${a.id}`} className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-warm-white">
                {a.photoUrl ? (
                  <Image
                    src={a.photoUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 30vw, 180px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-forest-muted/40">
                    <PawPrint className="h-10 w-10" strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <span className="line-clamp-2 px-1 text-center text-sm font-semibold text-forest">
                {a.name}
              </span>
            </Link>
          </div>
        ))}

        <button
          onClick={openPicker}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-forest-muted hover:border-sage hover:text-forest"
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs font-medium">Hinzufügen</span>
        </button>
      </div>

      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={mode === "choice" ? "Tier hinzufügen" : "Bestehendes Tier wählen"}
      >
        {mode === "choice" ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setMode("existing")}
              disabled={available.length === 0}
              className="flex flex-col items-start gap-1 rounded-2xl border border-border p-4 text-left hover:border-sage disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-medium text-forest">Bestehendes Tier</span>
              <span className="text-xs text-forest-muted">
                {available.length === 0
                  ? "Alle erfassten Tiere sind bereits zugeordnet."
                  : "Ein bereits erfasstes Tier dieser Zone zuordnen."}
              </span>
            </button>
            <Link
              href={`/tiere/neu?zoneId=${zoneId}`}
              className="flex flex-col items-start gap-1 rounded-2xl border border-border p-4 text-left hover:border-sage"
            >
              <span className="font-medium text-forest">Neues Tier</span>
              <span className="text-xs text-forest-muted">
                Foto aufnehmen oder aus der Galerie wählen – wird automatisch dieser Zone
                zugeteilt.
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {available.map((a) => (
              <button
                key={a.id}
                disabled={pending && busyId === a.id}
                onClick={() => handleAdd(a.id)}
                className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-cream disabled:opacity-50"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {a.photoUrl ? (
                    <Image src={a.photoUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-forest-muted/40">
                      <PawPrint className="h-5 w-5" strokeWidth={1.25} />
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-forest">{a.name}</span>
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}
