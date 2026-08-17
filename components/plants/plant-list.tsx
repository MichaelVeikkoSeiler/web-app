import Link from "next/link";
import { Plus, Leaf } from "lucide-react";
import { TileGrid, type Tile } from "@/components/ui/tile-grid";

export function PlantList({ plants }: { plants: Tile[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-forest">
          {plants.length} {plants.length === 1 ? "Pflanze" : "Pflanzen"}
        </h1>
        <Link
          href="/pflanzen/neu"
          aria-label="Pflanze hinzufügen"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-warm-white shadow-sm transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </div>

      {plants.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
          Noch keine Pflanzen erfasst.
        </p>
      ) : (
        <TileGrid tiles={plants} basePath="/pflanzen" icon={Leaf} />
      )}
    </div>
  );
}
