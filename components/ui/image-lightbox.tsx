"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type LightboxPhoto = { id: number; blobUrl: string; createdAt?: Date };

export function ImageLightbox({
  photos,
  initialIndex,
  open,
  onClose,
  alt,
}: {
  photos: LightboxPhoto[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  alt: string;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  if (!open || photos.length === 0) return null;

  function goTo(i: number) {
    setIndex((i + photos.length) % photos.length);
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

  const current = photos[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={photos.length > 1 ? onTouchStart : undefined}
      onTouchEnd={photos.length > 1 ? onTouchEnd : undefined}
    >
      <div
        className="relative h-full w-full max-w-3xl p-4 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={current.id}
          src={current.blobUrl}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>

      {current.createdAt && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-forest/60 px-3 py-1.5 text-xs text-warm-white backdrop-blur-sm">
          Hochgeladen am{" "}
          {current.createdAt.toLocaleDateString("de-CH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      )}

      <button
        onClick={onClose}
        aria-label="Schliessen"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
      >
        <X className="h-5 w-5" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(index - 1);
            }}
            aria-label="Vorheriges Foto"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(index + 1);
            }}
            aria-label="Nächstes Foto"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
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
