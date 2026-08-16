import Link from "next/link";
import Image from "next/image";
import { PawPrint } from "lucide-react";

export type AnimalTile = {
  id: number;
  name: string;
  imageUrl: string | null;
};

export function AnimalGrid({ animals }: { animals: AnimalTile[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {animals.map((animal) => (
        <Link
          key={animal.id}
          href={`/tiere/${animal.id}`}
          className="flex flex-col gap-2 rounded-2xl p-1 transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-warm-white">
            {animal.imageUrl ? (
              <Image
                src={animal.imageUrl}
                alt={animal.name}
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
          <div className="px-1 text-center">
            <h3 className="line-clamp-2 text-sm font-semibold text-forest">{animal.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
