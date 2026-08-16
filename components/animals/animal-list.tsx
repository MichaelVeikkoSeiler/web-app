import Link from "next/link";
import { Plus } from "lucide-react";
import { AnimalGrid, type AnimalTile } from "@/components/animals/animal-grid";

export function AnimalList({ animals }: { animals: AnimalTile[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-forest">
          {animals.length} {animals.length === 1 ? "Tier" : "Tiere"}
        </h1>
        <Link
          href="/tiere/neu"
          aria-label="Tier hinzufügen"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-warm-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </div>

      {animals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
          Noch keine Tiere erfasst. Legt eure Gartenbewohner an, um sie hier zu sehen.
        </p>
      ) : (
        <AnimalGrid animals={animals} />
      )}
    </div>
  );
}
