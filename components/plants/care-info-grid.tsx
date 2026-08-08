import { Flower2, Droplets, Cherry, Scissors, Sprout, type LucideIcon } from "lucide-react";

type CareCard = {
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
  };
}) {
  const cards: CareCard[] = [
    {
      icon: Flower2,
      label: "Blüte",
      text: plant.bloomPeriodText,
      colorClass: "bg-bloom/40 text-bloom-text",
    },
    {
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
            icon: Cherry,
            label: "Ernte",
            text: plant.harvestPeriodText,
            colorClass: "bg-sun/40 text-sun-text",
          },
        ]
      : []),
    {
      icon: Scissors,
      label: "Rückschnitt",
      text: plant.pruningPeriodText,
      colorClass: "bg-care/40 text-care-text",
    },
    {
      icon: Sprout,
      label: "Düngen",
      text: plant.fertilizingPeriodText,
      colorClass: "bg-soil/40 text-soil-text",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className={`flex flex-col gap-1.5 rounded-2xl p-3 ${c.colorClass}`}>
          <c.icon className="h-4 w-4" strokeWidth={2} />
          <span className="text-xs font-semibold">{c.label}</span>
          <span className="text-xs leading-snug">{c.text || "Keine Angabe"}</span>
        </div>
      ))}
    </div>
  );
}
