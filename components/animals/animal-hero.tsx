"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, PawPrint, Loader2, Trash2 } from "lucide-react";
import { deleteAnimalPhoto } from "@/lib/actions/animals";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type Photo = { id: number; blobUrl: string; isPrimary: boolean; createdAt: Date };

export function AnimalHero({
  animalId,
  photos,
  alt,
}: {
  animalId: number;
  photos: Photo[];
  alt: string;
}) {
  const ordered = [...photos].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const safeIndex = ordered.length > 0 ? Math.min(index, ordered.length - 1) : 0;
  const current = ordered[safeIndex];

  function goTo(i: number) {
    setIndex((i + ordered.length) % ordered.length);
  }

  function handleDelete() {
    if (!current) return;
    startTransition(() => deleteAnimalPhoto(current.id, animalId));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) goTo(safeIndex - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(safeIndex + 1);
  }

  return (
    <div className="relative left-1/2 -mt-4 w-screen -ml-[50vw] sm:-mt-8 md:static md:left-auto md:ml-0 md:w-full">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-b-3xl bg-warm-white sm:aspect-video"
        onTouchStart={ordered.length > 1 ? onTouchStart : undefined}
        onTouchEnd={ordered.length > 1 ? onTouchEnd : undefined}
      >
      {current ? (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Foto vergrössern"
          className="absolute inset-0"
        >
          <Image
            key={current.id}
            src={current.blobUrl}
            alt={alt}
            fill
            sizes="(max-width: 767px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        </button>
      ) : (
        <div className="flex h-full items-center justify-center text-forest-muted/40">
          <PawPrint className="h-16 w-16" strokeWidth={1.25} />
        </div>
      )}

      {current && (
        <button
          onClick={handleDelete}
          disabled={pending}
          aria-label="Foto löschen"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/90 text-forest shadow-sm backdrop-blur hover:bg-attention/20 hover:text-attention-text disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}

      {ordered.length > 1 && (
        <>
          <button
            onClick={() => goTo(safeIndex - 1)}
            aria-label="Vorheriges Foto"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(safeIndex + 1)}
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
                  i === safeIndex ? "w-4 bg-warm-white" : "w-1.5 bg-warm-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
      </div>

      <ImageLightbox
        photos={ordered}
        initialIndex={safeIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt={alt}
      />
    </div>
  );
}
