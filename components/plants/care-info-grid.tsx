"use client";

import { useState } from "react";
import {
  Flower2,
  Droplets,
  Cherry,
  Scissors,
  Sprout,
  Sparkles,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

type CareCard = {
  key: string;
  icon: LucideIcon;
  label: string;
  text: string | null;
  colorClass: string;
};

export function CareInfoGrid({
  plant,
}: {
  plant: {
    bloomPeriodText: string | null;
    isFruitOrBerry: boolean;
    harvestPeriodText: string | null;
    wateringRhythmDays: number | null;
    wateringNotes: string | null;
    pruningPeriodText: string | null;
    fertilizingPeriodText: string | null;
    factsText: string | null;
  };
}) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const cards: CareCard[] = [
    {
      key: "bloom",
      icon: Flower2,
      label: "Blüte",
      text: plant.bloomPeriodText,
      colorClass: "bg-bloom/40 text-bloom-text",
    },
    {
      key: "water",
      icon: Droplets,
      label: "Giessen",
      text: plant.wateringRhythmDays
        ? `Alle ${plant.wateringRhythmDays} Tage${plant.wateringNotes ? " · " + plant.wateringNotes : ""}`
        : plant.wateringNotes,
      colorClass: "bg-water/40 text-water-text",
    },
    ...(plant.isFruitOrBerry
      ? [
          {
            key: "harvest",
            icon: Cherry,
            label: "Ernte",
            text: plant.harvestPeriodText,
            colorClass: "bg-sun/40 text-sun-text",
          },
        ]
      : []),
    {
      key: "pruning",
      icon: Scissors,
      label: "Rückschnitt",
      text: plant.pruningPeriodText,
      colorClass: "bg-care/40 text-care-text",
    },
    {
      key: "fertilizing",
      icon: Sprout,
      label: "Düngen",
      text: plant.fertilizingPeriodText,
      colorClass: "bg-soil/40 text-soil-text",
    },
    ...(plant.factsText
      ? [
          {
            key: "facts",
            icon: Sparkles,
            label: "Wissenswertes",
            text: plant.factsText,
            colorClass: "bg-sun/40 text-sun-text",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      {cards.map((c) => {
        const open = openKeys.has(c.key);
        return (
          <div key={c.key} className={`overflow-hidden rounded-2xl ${c.colorClass}`}>
            <button
              onClick={() => toggle(c.key)}
              aria-expanded={open}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
            >
              <c.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-sm font-semibold">{c.label}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <p className="px-3.5 pb-3 text-sm leading-snug">{c.text || "Keine Angabe"}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
