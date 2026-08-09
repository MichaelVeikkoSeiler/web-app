"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronDown, Droplets, MapPin, Scissors, Sprout } from "lucide-react";
import { waterPlant, markPruned, markFertilized } from "@/lib/actions/plants";
import { Sheet } from "@/components/ui/sheet";
import type { TodoItem } from "@/lib/plants-query";

export type ZoneConflictItem = {
  zoneId: number;
  zoneName: string;
  label: string;
  text: string | null;
};

type GroupKey = TodoItem["type"] | "conflicts";

const typeOrder: TodoItem["type"][] = ["water", "prune", "fertilize"];
const typeLabel: Record<TodoItem["type"], string> = {
  water: "Giessen",
  prune: "Rückschnitt",
  fertilize: "Düngen",
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
  const [dismissedZoneIds, setDismissedZoneIds] = useState<Set<number>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<GroupKey>>(new Set());
  const [, startTransition] = useTransition();
  const [openConflict, setOpenConflict] = useState<ZoneConflictItem | null>(null);

  const visible = items.filter((item) => !doneKeys.has(itemKey(item)));
  const visibleConflicts = conflicts.filter((c) => !dismissedZoneIds.has(c.zoneId));

  const groups = typeOrder
    .map((type) => ({ type, items: visible.filter((item) => item.type === type) }))
    .filter((g) => g.items.length > 0);

  function toggle(key: GroupKey) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleCheck(item: TodoItem) {
    setDoneKeys((prev) => new Set(prev).add(itemKey(item)));
    startTransition(() => typeAction[item.type](item.plantId));
  }

  function handleDismissConflict(zoneId: number) {
    setDismissedZoneIds((prev) => new Set(prev).add(zoneId));
  }

  if (groups.length === 0 && visibleConflicts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Aktuell braucht nichts besondere Aufmerksamkeit.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {groups.map((group) => {
          const open = openGroups.has(group.type);
          const Icon = typeIcon[group.type];
          return (
            <div
              key={group.type}
              className="overflow-hidden rounded-2xl border border-border bg-warm-white"
            >
              <button
                onClick={() => toggle(group.type)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Icon className={`h-4 w-4 shrink-0 ${typeColor[group.type]}`} />
                <span className="flex-1 font-display text-base text-forest">
                  {typeLabel[group.type]}
                </span>
                <span className="text-xs text-forest-muted">{group.items.length}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-forest-muted transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="flex flex-col gap-1 border-t border-border p-2">
                  {group.items.map((item) => (
                    <div
                      key={itemKey(item)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream"
                    >
                      <button
                        aria-label={`${item.label} für ${item.plantName} erledigt`}
                        onClick={() => handleCheck(item)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-sage text-transparent hover:bg-sage/20 hover:text-forest"
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </button>
                      <Link
                        href={`/pflanzen/${item.plantId}`}
                        className="flex-1 truncate text-sm text-forest hover:underline"
                      >
                        {item.plantName}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {visibleConflicts.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-warm-white">
            <button
              onClick={() => toggle("conflicts")}
              aria-expanded={openGroups.has("conflicts")}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <MapPin className="h-4 w-4 shrink-0 text-attention-text" />
              <span className="flex-1 font-display text-base text-forest">Zonenkonflikte</span>
              <span className="text-xs text-forest-muted">{visibleConflicts.length}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-forest-muted transition-transform ${openGroups.has("conflicts") ? "rotate-180" : ""}`}
              />
            </button>

            {openGroups.has("conflicts") && (
              <div className="flex flex-col gap-1 border-t border-border p-2">
                {visibleConflicts.map((c) => (
                  <div
                    key={`conflict-${c.zoneId}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream"
                  >
                    <button
                      aria-label={`Konflikt in ${c.zoneName} ausblenden`}
                      onClick={() => handleDismissConflict(c.zoneId)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-sage text-transparent hover:bg-sage/20 hover:text-forest"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <Link
                      href={`/zonen/${c.zoneId}`}
                      className="flex-1 truncate text-sm text-forest hover:underline"
                    >
                      {c.zoneName}
                    </Link>
                    <button
                      onClick={() => setOpenConflict(c)}
                      className="shrink-0 text-xs font-medium text-attention-text hover:underline"
                    >
                      {c.label}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
