"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, Pencil, Trash2, Sun, CloudSun, CloudMoon } from "lucide-react";
import { reorderZones, deleteZone } from "@/lib/actions/zones";
import type { ZoneInput } from "@/lib/actions/zones";
import { ZonePlants } from "@/components/zones/zone-plants";

export type Zone = { id: number; plants: { id: number; name: string }[] } & ZoneInput;

const lightIcon = {
  sonnig: Sun,
  halbschattig: CloudSun,
  schattig: CloudMoon,
};

const orientationLabel = { N: "Norden", O: "Osten", S: "Süden", W: "Westen" };

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 8;

type Rect = { id: number; top: number; height: number };

export function ZoneReorderList({
  zones,
  allPlants,
  onEdit,
}: {
  zones: Zone[];
  allPlants: { id: number; name: string }[];
  onEdit: (zone: Zone) => void;
}) {
  const [items, setItems] = useState(zones);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [, startReorderTransition] = useTransition();

  const itemRefs = useRef(new Map<number, HTMLDivElement>());
  const startRectsRef = useRef<Rect[]>([]);
  const startClientYRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const draggingIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (draggingId === null) setItems(zones);
  }, [zones, draggingId]);

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function computeTargetIndex(clientY: number) {
    const dragged = startRectsRef.current.find((r) => r.id === draggingIdRef.current);
    if (!dragged) return 0;
    const delta = clientY - startClientYRef.current;
    const draggedCenter = dragged.top + dragged.height / 2 + delta;

    const others = startRectsRef.current.filter((r) => r.id !== draggingIdRef.current);
    let index = 0;
    for (const r of others) {
      if (r.top + r.height / 2 < draggedCenter) index++;
    }
    return index;
  }

  function handlePointerDown(e: React.PointerEvent, zone: Zone) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startClientYRef.current = e.clientY;
    movedRef.current = false;
    const target = e.currentTarget;

    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      if (movedRef.current) return;
      target.setPointerCapture(e.pointerId);
      startRectsRef.current = items.map((it) => {
        const el = itemRefs.current.get(it.id)!;
        const r = el.getBoundingClientRect();
        return { id: it.id, top: r.top, height: r.height };
      });
      draggingIdRef.current = zone.id;
      setDraggingId(zone.id);
      setDragDelta(0);
      setTargetIndex(items.findIndex((it) => it.id === zone.id));
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (draggingIdRef.current == null) {
      const dy = Math.abs(e.clientY - startClientYRef.current);
      if (dy > MOVE_CANCEL_PX) {
        movedRef.current = true;
        clearLongPressTimer();
      }
      return;
    }
    e.preventDefault();
    const delta = e.clientY - startClientYRef.current;
    setDragDelta(delta);
    setTargetIndex(computeTargetIndex(e.clientY));
  }

  function endDrag(e: React.PointerEvent) {
    clearLongPressTimer();
    const id = draggingIdRef.current;
    if (id == null) return;

    const finalIndex = computeTargetIndex(e.clientY);
    const currentIndex = items.findIndex((it) => it.id === id);
    let next = items;
    if (finalIndex !== currentIndex) {
      next = [...items];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(finalIndex, 0, moved);
      setItems(next);
      startReorderTransition(() => reorderZones(next.map((z) => z.id)));
    }

    draggingIdRef.current = null;
    setDraggingId(null);
    setDragDelta(0);
    setTargetIndex(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((zone, index) => {
        const Icon = lightIcon[zone.light];
        const isDragging = draggingId === zone.id;
        const showIndicator = draggingId !== null && !isDragging && targetIndex === index;

        return (
          <div key={zone.id} className="relative">
            {showIndicator && (
              <div className="absolute -top-2 h-1 w-full rounded-full bg-sage" />
            )}
            <div
              ref={(el) => {
                if (el) itemRefs.current.set(zone.id, el);
                else itemRefs.current.delete(zone.id);
              }}
              onPointerDown={(e) => handlePointerDown(e, zone)}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={
                isDragging
                  ? { transform: `translateY(${dragDelta}px)`, touchAction: "none" }
                  : undefined
              }
              className={`flex select-none items-start gap-2 rounded-2xl border border-border bg-warm-white p-4 ${
                isDragging ? "relative z-20 shadow-lg" : ""
              }`}
            >
              <span className="mt-1 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center text-forest-muted/50 active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </span>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 font-display text-lg text-forest">
                      {zone.number != null && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream text-xs font-semibold text-forest-muted">
                          {zone.number}
                        </span>
                      )}
                      {zone.name}
                    </h3>
                    <p className="text-xs text-forest-muted">
                      {zone.plants.length} {zone.plants.length === 1 ? "Pflanze" : "Pflanzen"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      aria-label="Zone bearbeiten"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onEdit(zone)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-forest-muted hover:bg-cream"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Zone löschen"
                      disabled={deletePending}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        if (
                          confirm(
                            `Zone "${zone.name}" wirklich löschen? Zuordnungen von Pflanzen zu dieser Zone werden ebenfalls entfernt.`,
                          )
                        ) {
                          startDeleteTransition(() => deleteZone(zone.id));
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-forest-muted hover:bg-attention/20 hover:text-attention-text"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-sun/40 px-2.5 py-1 text-sun-text">
                    <Icon className="h-3.5 w-3.5" />
                    {zone.light}
                  </span>
                  <span className="rounded-full bg-water/40 px-2.5 py-1 text-water-text">
                    {orientationLabel[zone.orientation]}
                  </span>
                  {zone.soilType && (
                    <span className="rounded-full bg-soil/40 px-2.5 py-1 text-soil-text">
                      {zone.soilType}
                    </span>
                  )}
                </div>

                {zone.notes && <p className="text-sm text-forest-muted">{zone.notes}</p>}

                <div onPointerDown={(e) => e.stopPropagation()}>
                  <ZonePlants
                    zoneId={zone.id}
                    assignedPlants={zone.plants}
                    allPlants={allPlants}
                  />
                </div>
              </div>
            </div>
            {draggingId !== null &&
              index === items.length - 1 &&
              targetIndex !== null &&
              targetIndex >= items.length - 1 &&
              zone.id !== draggingId && (
                <div className="absolute -bottom-2 h-1 w-full rounded-full bg-sage" />
              )}
          </div>
        );
      })}
    </div>
  );
}
