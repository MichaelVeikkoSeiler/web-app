"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Droplets, Flower2, Flame, Feather, type LucideIcon } from "lucide-react";
import type { PlantHighlights } from "@/lib/plants-query";

const sectionDefs: {
  key: keyof PlantHighlights;
  icon: LucideIcon;
  colorClass: string;
  title: string;
  emptyText: string;
}[] = [
  {
    key: "mostWater",
    icon: Droplets,
    colorClass: "bg-water/40 text-water-text",
    title: "Braucht am meisten Wasser",
    emptyText: "Keine Angabe zum Giessrhythmus vorhanden.",
  },
  {
    key: "leastWater",
    icon: Droplets,
    colorClass: "bg-water/40 text-water-text",
    title: "Braucht am wenigsten Wasser",
    emptyText: "Keine Angabe zum Giessrhythmus vorhanden.",
  },
  {
    key: "longestBloom",
    icon: Flower2,
    colorClass: "bg-bloom/40 text-bloom-text",
    title: "Blüht am längsten",
    emptyText: "Keine Angabe zur Blütezeit vorhanden.",
  },
  {
    key: "shortestBloom",
    icon: Flower2,
    colorClass: "bg-bloom/40 text-bloom-text",
    title: "Blüht am wenigsten lang",
    emptyText: "Keine Angabe zur Blütezeit vorhanden.",
  },
  {
    key: "mostDemanding",
    icon: Flame,
    colorClass: "bg-sun/40 text-sun-text",
    title: "Allgemein am anspruchsvollsten",
    emptyText: "Keine Angabe zum Pflegeaufwand vorhanden.",
  },
  {
    key: "leastDemanding",
    icon: Feather,
    colorClass: "bg-soil/40 text-soil-text",
    title: "Allgemein am pflegeleichtesten",
    emptyText: "Keine Angabe zum Pflegeaufwand vorhanden.",
  },
];

export function HighlightSections({ highlights }: { highlights: PlantHighlights }) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {sectionDefs.map((def) => {
        const items = highlights[def.key];
        const open = openKeys.has(def.key);
        return (
          <div
            key={def.key}
            className="overflow-hidden rounded-2xl border border-border bg-warm-white"
          >
            <button
              onClick={() => toggle(def.key)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${def.colorClass}`}
              >
                <def.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="flex-1 font-display text-base text-forest">{def.title}</span>
              <span className="text-xs text-forest-muted">{items.length}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-forest-muted transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="flex flex-col gap-1 border-t border-border p-2">
                {items.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-forest-muted">{def.emptyText}</p>
                ) : (
                  items.map((p, i) => (
                    <Link
                      key={p.plantId}
                      href={`/pflanzen/${p.plantId}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-cream"
                    >
                      <span className="w-5 shrink-0 text-xs text-forest-muted">{i + 1}.</span>
                      <span className="flex-1 text-forest">{p.plantName}</span>
                      <span className="text-xs text-forest-muted">{p.display}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
