"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  plantCompareFields,
  type PlantCompareRow,
  type PlantCompareField,
} from "@/lib/plant-compare";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

type Case = {
  field: PlantCompareField;
  options: PlantCompareRow[];
  correctId: number;
};

const LETTERS = ["A", "B", "C", "D"];
const OPTION_COUNT = 4;
const MAX_TRIES = 40;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickCase(pool: PlantCompareRow[]): Case | null {
  for (let i = 0; i < MAX_TRIES; i++) {
    const field = plantCompareFields[Math.floor(Math.random() * plantCompareFields.length)];
    const eligible = pool.filter((p) => field.getValue(p) != null);
    if (eligible.length < OPTION_COUNT) continue;

    const options = shuffle(eligible).slice(0, OPTION_COUNT);
    const sorted = [...options].sort((a, b) => {
      const va = field.getValue(a)!;
      const vb = field.getValue(b)!;
      return field.direction === "asc" ? va - vb : vb - va;
    });
    const best = sorted[0];
    const secondBest = sorted[1];
    // Eindeutigkeit sicherstellen: bester Wert darf nicht mit dem zweitbesten gleichauf sein.
    if (field.getValue(best) === field.getValue(secondBest)) continue;

    return { field, options: shuffle(options), correctId: best.id };
  }
  return null;
}

export function Detektiv({ pool }: { pool: PlantCompareRow[] }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState<Case | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noData, setNoData] = useState(false);

  function handleStart() {
    const first = pickCase(pool);
    if (!first) {
      setNoData(true);
      return;
    }
    setCurrent(first);
    setSelectedId(null);
    setStarted(true);
  }

  function handleNextCase() {
    const next = pickCase(pool);
    if (!next) {
      setNoData(true);
      return;
    }
    setCurrent(next);
    setSelectedId(null);
  }

  function handleSelect(plantId: number) {
    if (!current || selectedId !== null) return;
    setSelectedId(plantId);
    if (plantId === current.correctId) playCorrectSound();
    else playWrongSound();
  }

  if (noData || pool.length < OPTION_COUNT) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Für dieses Spiel sind aktuell noch nicht genügend Vergleichsdaten verfügbar.
      </p>
    );
  }

  if (!started || current === null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-8 text-center">
        <Search className="h-8 w-8 text-sage-dark" strokeWidth={1.5} />
        <p className="font-display text-lg text-forest">Garten-Detektiv</p>
        <p className="max-w-sm text-sm text-forest-muted">
          Kleine Fälle rund um deine eigenen Pflanzen — findest du die richtige Antwort?
        </p>
        <button
          onClick={handleStart}
          className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
        >
          Ersten Fall starten
        </button>
      </div>
    );
  }

  const correctPlant = current.options.find((p) => p.id === current.correctId)!;
  const showResult = selectedId !== null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-forest">{current.field.detektivQuestion}</p>

      <div className="flex flex-col gap-2">
        {current.options.map((plant, i) => {
          const isCorrectOption = plant.id === current.correctId;
          const isWrongSelected = showResult && selectedId === plant.id && !isCorrectOption;

          let style = "border-border bg-warm-white text-forest hover:border-sage";
          if (showResult && isCorrectOption) style = "border-care bg-care/40 text-care-text";
          else if (isWrongSelected) style = "border-attention bg-attention/40 text-attention-text";

          return (
            <button
              key={plant.id}
              onClick={() => handleSelect(plant.id)}
              disabled={showResult}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${style}`}
            >
              <span className="w-5 shrink-0 text-xs text-forest-muted">{LETTERS[i]}</span>
              <span className="flex-1">{plant.name}</span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-warm-white p-4 text-center">
          <p className="text-sm text-forest">
            {selectedId === current.correctId ? "✓ Richtig!" : "Leider nicht."}{" "}
            <span className="font-semibold">{correctPlant.name}</span>
          </p>
          <p className="text-xs text-forest-muted">
            {current.field.format(current.field.getValue(correctPlant)!)}
          </p>
          <button
            onClick={handleNextCase}
            className="flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
          >
            Nächster Fall
          </button>
        </div>
      )}
    </div>
  );
}
