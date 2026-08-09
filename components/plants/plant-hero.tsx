"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";

type Photo = { id: number; blobUrl: string; isPrimary: boolean };

export function PlantHero({ photos, alt }: { photos: Photo[]; alt: string }) {
  const ordered = [...photos].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const current = ordered[index];

  function goTo(i: number) {
    setIndex((i + ordered.length) % ordered.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) goTo(index - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
  }

  return (
    <div
      className="relative aspect-[7/5] w-full overflow-hidden rounded-3xl bg-cream"
      onTouchStart={ordered.length > 1 ? onTouchStart : undefined}
      onTouchEnd={ordered.length > 1 ? onTouchEnd : undefined}
    >
      {current ? (
        <Image
          key={current.id}
          src={current.blobUrl}
          alt={alt}
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center text-forest-muted/40">
          <Leaf className="h-16 w-16" strokeWidth={1.25} />
        </div>
      )}

      {ordered.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Vorheriges Foto"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Nächstes Foto"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {ordered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => goTo(i)}
                aria-label={`Foto ${i + 1} anzeigen`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-warm-white" : "w-1.5 bg-warm-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
