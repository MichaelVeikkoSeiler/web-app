"use client";

import { useMemo, useState } from "react";
import { Leaf } from "lucide-react";
import { PlantCard, type PlantCardData } from "@/components/plants/plant-card";
import { selectClasses } from "@/components/ui/field";

type Filter = "alle" | "bluete" | "pfluecken" | "zone" | "hilfe";

const filters: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "bluete", label: "In Blüte" },
  { key: "pfluecken", label: "Pflücken" },
  { key: "zone", label: "Zonen" },
  { key: "hilfe", label: "Hilfe" },
];

export function PlantsOverview({
  plants,
  zones,
}: {
  plants: PlantCardData[];
  zones: { id: number; name: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("alle");
  const [zoneName, setZoneName] = useState<string | undefined>(zones[0]?.name);

  const filtered = useMemo(() => {
    switch (filter) {
      case "bluete":
        return plants.filter((p) => p.inBloom);
      case "pfluecken":
        return plants.filter((p) => p.canHarvest);
      case "hilfe":
        return plants.filter((p) => p.needsHelp);
      case "zone":
        return plants.filter((p) => zoneName && p.zoneNames.includes(zoneName));
      default:
        return plants;
    }
  }, [plants, filter, zoneName]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-forest">Pflanzen</h1>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-sage text-forest"
                : "bg-warm-white text-forest-muted border border-border hover:bg-cream"
            }`}
          >
            {f.label}
          </button>
        ))}
        {filter === "zone" && (
          <select
            className={selectClasses + " min-h-11 w-auto"}
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-warm-white p-10 text-center text-forest-muted">
          <Leaf className="h-8 w-8" strokeWidth={1.25} />
          <p className="text-sm">Keine Pflanzen in dieser Ansicht.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((p) => (
            <PlantCard key={p.id} plant={p} />
          ))}
        </div>
      )}
    </div>
  );
}
