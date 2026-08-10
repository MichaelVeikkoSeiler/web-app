"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Leaf, Plus } from "lucide-react";
import type { ZoneGroup } from "@/lib/plants-query";

export function PlantsOverview({
  totalCount,
  groups,
}: {
  totalCount: number;
  groups: ZoneGroup[];
}) {
  const [openZoneIds, setOpenZoneIds] = useState<Set<number | null>>(new Set());

  function toggle(zoneId: number | null) {
    setOpenZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-forest">
          {totalCount} {totalCount === 1 ? "Pflanze" : "Pflanzen"}
        </h1>
        <Link
          href="/pflanzen/neu"
          aria-label="Pflanze hinzufügen"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-warm-white shadow-sm transition-transform active:scale-95 sm:hidden"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-warm-white p-10 text-center text-forest-muted">
          <Leaf className="h-8 w-8" strokeWidth={1.25} />
          <p className="text-sm">Noch keine Pflanzen erfasst.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => {
            const open = openZoneIds.has(group.zoneId);
            return (
              <div
                key={group.zoneId ?? "none"}
                className="overflow-hidden rounded-2xl border border-border bg-warm-white"
              >
                <button
                  onClick={() => toggle(group.zoneId)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {group.zoneImageUrl ? (
                      <Image
                        src={group.zoneImageUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-forest-muted/40">
                        <Leaf className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                    )}
                  </span>
                  <span className="flex-1 font-display text-base text-forest">
                    {group.zoneName}
                  </span>
                  <span className="text-xs text-forest-muted">{group.plants.length}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-forest-muted transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="flex flex-col gap-1 border-t border-border p-2">
                    {group.plants.map((p) => (
                      <Link
                        key={p.id}
                        href={`/pflanzen/${p.id}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream"
                      >
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                          {p.photoUrl ? (
                            <Image
                              src={p.photoUrl}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-forest-muted/40">
                              <Leaf className="h-5 w-5" strokeWidth={1.5} />
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-forest">{p.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
