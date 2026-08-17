import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";

export type Tile = { id: number; name: string; imageUrl: string | null };

export function TileGrid({
  tiles,
  basePath,
  icon: Icon,
}: {
  tiles: Tile[];
  basePath: string;
  icon: LucideIcon;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {tiles.map((tile) => (
        <Link
          key={tile.id}
          href={`${basePath}/${tile.id}`}
          className="flex flex-col gap-2 rounded-2xl p-1 transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-warm-white">
            {tile.imageUrl ? (
              <Image
                src={tile.imageUrl}
                alt={tile.name}
                fill
                sizes="(max-width: 640px) 30vw, 180px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-forest-muted/40">
                <Icon className="h-10 w-10" strokeWidth={1.25} />
              </div>
            )}
          </div>
          <div className="px-1 text-center">
            <h3 className="line-clamp-2 text-sm font-semibold text-forest">{tile.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
