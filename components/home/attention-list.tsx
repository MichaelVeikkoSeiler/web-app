"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Droplets, Scissors, Sprout } from "lucide-react";
import { waterPlant, markPruned, markFertilized } from "@/lib/actions/plants";
import { Sheet } from "@/components/ui/sheet";
import type { TodoItem } from "@/lib/plants-query";

export type ZoneConflictItem = {
  zoneId: number;
  zoneName: string;
  label: string;
  text: string | null;
};

const typeIcon = { water: Droplets, prune: Scissors, fertilize: Sprout };
const typeColor = {
  water: "text-water-text",
  prune: "text-care-text",
  fertilize: "text-soil-text",
};
const typeAction: Record<TodoItem["type"], (plantId: number) => Promise<void>> = {
  water: waterPlant,
  prune: markPruned,
  fertilize: markFertilized,
};

function itemKey(item: TodoItem) {
  return `${item.plantId}-${item.type}`;
}

export function AttentionList({
  items,
  conflicts,
}: {
  items: TodoItem[];
  conflicts: ZoneConflictItem[];
}) {
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [openConflict, setOpenConflict] = useState<ZoneConflictItem | null>(null);

  const visible = items.filter((item) => !doneKeys.has(itemKey(item)));

  function handleCheck(item: TodoItem) {
    setDoneKeys((prev) => new Set(prev).add(itemKey(item)));
    startTransition(() => typeAction[item.type](item.plantId));
  }

  if (visible.length === 0 && conflicts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Aktuell braucht nichts besondere Aufmerksamkeit.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {visible.map((item) => {
          const Icon = typeIcon[item.type];
          return (
            <li
              key={itemKey(item)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-warm-white px-4 py-3"
            >
              <button
                aria-label={`${item.label} für ${item.plantName} erledigt`}
                onClick={() => handleCheck(item)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-sage text-transparent hover:bg-sage/20 hover:text-forest"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </button>
              <Icon className={`h-4 w-4 shrink-0 ${typeColor[item.type]}`} />
              <Link
                href={`/pflanzen/${item.plantId}`}
                className="flex-1 truncate text-sm text-forest hover:underline"
              >
                {item.plantName}
              </Link>
              <span className="text-xs text-forest-muted">{item.label}</span>
            </li>
          );
        })}

        {conflicts.map((c) => (
          <li key={`conflict-${c.zoneId}`}>
            <button
              onClick={() => setOpenConflict(c)}
              className="flex w-full items-center gap-3 rounded-2xl border border-attention/60 bg-attention/10 px-4 py-3 text-left"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-attention-text" />
              <span className="flex-1 truncate text-sm text-forest">{c.zoneName}</span>
              <span className="shrink-0 text-xs font-medium text-attention-text">
                Konflikt: {c.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet
        open={openConflict !== null}
        onClose={() => setOpenConflict(null)}
        title={`Konflikt: ${openConflict?.label ?? ""}`}
      >
        <p className="text-sm leading-relaxed text-forest-muted">
          {openConflict?.text || "Keine weiteren Details verfügbar."}
        </p>
      </Sheet>
    </>
  );
}
