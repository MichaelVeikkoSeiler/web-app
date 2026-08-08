import Link from "next/link";
import Image from "next/image";
import { Flower2, Cherry, AlertCircle, Leaf } from "lucide-react";

export type PlantCardData = {
  id: number;
  scientificName: string;
  germanName: string | null;
  commonName: string | null;
  photoUrl: string | null;
  zoneNames: string[];
  inBloom: boolean;
  canHarvest: boolean;
  needsHelp: boolean;
};

export function PlantCard({ plant }: { plant: PlantCardData }) {
  return (
    <Link
      href={`/pflanzen/${plant.id}`}
      className="flex flex-col gap-2 rounded-2xl p-1 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-warm-white">
        {plant.photoUrl ? (
          <Image
            src={plant.photoUrl}
            alt={plant.germanName ?? plant.scientificName}
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-forest-muted/40">
            <Leaf className="h-10 w-10" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1">
          {plant.needsHelp && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-attention text-attention-text shadow-sm">
              <AlertCircle className="h-3.5 w-3.5" />
            </span>
          )}
          {plant.inBloom && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bloom text-bloom-text shadow-sm">
              <Flower2 className="h-3.5 w-3.5" />
            </span>
          )}
          {plant.canHarvest && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-care text-care-text shadow-sm">
              <Cherry className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
      <div className="px-1 text-center">
        <h3 className="truncate text-base font-semibold text-forest">
          {plant.germanName ?? plant.scientificName}
        </h3>
        <p className="truncate text-xs italic text-forest-muted">
          {plant.scientificName}
        </p>
        {plant.zoneNames.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-forest-muted">
            {plant.zoneNames.join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
