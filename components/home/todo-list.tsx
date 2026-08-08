"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Droplets, Scissors, Sprout } from "lucide-react";
import { waterPlant, markPruned, markFertilized } from "@/lib/actions/plants";
import type { TodoItem } from "@/lib/plants-query";

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

export function TodoList({ items }: { items: TodoItem[] }) {
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const visible = items.filter((item) => !doneKeys.has(itemKey(item)));

  function handleCheck(item: TodoItem) {
    setDoneKeys((prev) => new Set(prev).add(itemKey(item)));
    startTransition(() => typeAction[item.type](item.plantId));
  }

  if (visible.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Aktuell braucht keine Pflanze besondere Aufmerksamkeit.
      </p>
    );
  }

  return (
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
    </ul>
  );
}
