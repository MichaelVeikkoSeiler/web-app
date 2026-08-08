"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { reorderZones } from "@/lib/actions/zones";

export type ZoneTile = {
  id: number;
  name: string;
  number: number | null;
  imageUrl: string | null;
  plantCount: number;
};

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 8;

export function ZoneGrid({ zones }: { zones: ZoneTile[] }) {
  const [items, setItems] = useState(zones);
  const [prevZones, setPrevZones] = useState(zones);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [, startReorderTransition] = useTransition();

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const draggedRef = useRef(false);
  const draggingIdRef = useRef<number | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  if (zones !== prevZones && draggingId === null) {
    setPrevZones(zones);
    setItems(zones);
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function idAtPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y)?.closest("[data-zone-id]");
    const id = el?.getAttribute("data-zone-id");
    return id ? Number(id) : null;
  }

  function handlePointerDown(e: React.PointerEvent, zoneId: number) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    const target = e.currentTarget;

    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      if (movedRef.current) return;
      target.setPointerCapture(e.pointerId);
      draggingIdRef.current = zoneId;
      draggedRef.current = true;
      setDraggingId(zoneId);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (draggingIdRef.current == null) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        movedRef.current = true;
        clearLongPressTimer();
      }
      return;
    }
    e.preventDefault();
    const overId = idAtPoint(e.clientX, e.clientY);
    if (overId != null && overId !== draggingIdRef.current) {
      setItems((current) => {
        const from = current.findIndex((z) => z.id === draggingIdRef.current);
        const to = current.findIndex((z) => z.id === overId);
        if (from === -1 || to === -1) return current;
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    }
  }

  function endDrag() {
    clearLongPressTimer();
    const wasDragging = draggingIdRef.current != null;
    draggingIdRef.current = null;
    setDraggingId(null);
    if (wasDragging) {
      startReorderTransition(() => reorderZones(items.map((z) => z.id)));
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((zone) => {
        const isDragging = draggingId === zone.id;
        return (
          <Link
            key={zone.id}
            href={`/zonen/${zone.id}`}
            data-zone-id={zone.id}
            onPointerDown={(e) => handlePointerDown(e, zone.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={(e) => {
              if (draggedRef.current || movedRef.current) {
                e.preventDefault();
              }
              draggedRef.current = false;
            }}
            style={isDragging ? { touchAction: "none" } : undefined}
            className={`flex select-none flex-col gap-2 rounded-2xl p-1 transition-shadow ${
              isDragging ? "relative z-20 opacity-70 shadow-lg" : "hover:shadow-md"
            }`}
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-warm-white">
              {zone.imageUrl ? (
                <Image
                  src={zone.imageUrl}
                  alt={zone.name}
                  fill
                  sizes="(max-width: 640px) 45vw, 220px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-forest-muted/40">
                  <MapPin className="h-10 w-10" strokeWidth={1.25} />
                </div>
              )}
            </div>
            <div className="px-1">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-forest">
                {zone.number != null && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-semibold text-forest-muted">
                    {zone.number}
                  </span>
                )}
                <span className="truncate">{zone.name}</span>
              </h3>
              <p className="truncate text-xs text-forest-muted">
                {zone.plantCount} {zone.plantCount === 1 ? "Pflanze" : "Pflanzen"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
