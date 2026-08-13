import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";

export type OtherZoneTile = {
  id: number;
  name: string;
  imageUrl: string | null;
};

export function OtherZonesOverview({ zones }: { zones: OtherZoneTile[] }) {
  if (zones.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg text-forest">Weitere Zonen</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {zones.map((zone) => (
          <Link
            key={zone.id}
            href={`/zonen/${zone.id}`}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border bg-warm-white">
              {zone.imageUrl ? (
                <Image src={zone.imageUrl} alt={zone.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-forest-muted/40">
                  <MapPin className="h-6 w-6" strokeWidth={1.25} />
                </div>
              )}
            </div>
            <span className="w-full truncate text-center text-xs text-forest-muted">{zone.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
