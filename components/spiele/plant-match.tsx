"use client";

import { useState } from "react";
import Image from "next/image";
import { Swords } from "lucide-react";
import {
  plantCompareFields,
  isFieldAvailable,
  fieldWinner,
  fieldExplanation,
  type PlantCompareRow,
  type PlantCompareField,
} from "@/lib/plant-compare";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

type Round = { a: PlantCompareRow; b: PlantCompareRow; field: PlantCompareField };

const MAX_TRIES = 40;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRound(pool: PlantCompareRow[]): Round | null {
  if (pool.length < 2) return null;
  for (let i = 0; i < MAX_TRIES; i++) {
    const [a, b] = shuffle(pool).slice(0, 2);
    const validFields = plantCompareFields.filter((f) => isFieldAvailable(f, a, b));
    if (validFields.length > 0) {
      const field = validFields[Math.floor(Math.random() * validFields.length)];
      return { a, b, field };
    }
  }
  return null;
}

export function PlantMatch({ pool }: { pool: PlantCompareRow[] }) {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState<Round | null>(null);
  const [selected, setSelected] = useState<"a" | "b" | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0, streak: 0 });
  const [noData, setNoData] = useState(false);

  function handleStart() {
    const first = pickRound(pool);
    if (!first) {
      setNoData(true);
      return;
    }
    setRound(first);
    setSelected(null);
    setScore({ correct: 0, wrong: 0, streak: 0 });
    setStarted(true);
  }

  function handleNextRound() {
    const next = pickRound(pool);
    if (!next) {
      setNoData(true);
      return;
    }
    setRound(next);
    setSelected(null);
  }

  function handleSelect(side: "a" | "b") {
    if (!round || selected !== null) return;
    setSelected(side);
    const winner = fieldWinner(round.field, round.a, round.b);
    if (side === winner) {
      setScore((s) => ({ correct: s.correct + 1, wrong: s.wrong, streak: s.streak + 1 }));
      playCorrectSound();
    } else {
      setScore((s) => ({ correct: s.correct, wrong: s.wrong + 1, streak: 0 }));
      playWrongSound();
    }
  }

  if (noData || pool.length < 2) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Für dieses Spiel sind aktuell noch nicht genügend Vergleichsdaten verfügbar.
      </p>
    );
  }

  if (!started || round === null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-8 text-center">
        <Swords className="h-8 w-8 text-sage-dark" strokeWidth={1.5} />
        <p className="font-display text-lg text-forest">Welche Pflanze gewinnt?</p>
        <p className="max-w-sm text-sm text-forest-muted">
          Zwei Pflanzen treten an — du entscheidest anhand einer zufälligen Frage, wer gewinnt.
        </p>
        <button
          onClick={handleStart}
          className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
        >
          Los geht's
        </button>
      </div>
    );
  }

  const winner = selected !== null ? fieldWinner(round.field, round.a, round.b) : null;
  const explanation = selected !== null ? fieldExplanation(round.field, round.a, round.b) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-forest-muted">
        <span>
          Richtig: {score.correct} · Falsch: {score.wrong}
        </span>
        <span>Serie: {score.streak}</span>
      </div>

      <p className="text-center text-sm font-medium text-forest">{round.field.matchQuestion}</p>

      <div className="grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => {
          const plant = side === "a" ? round.a : round.b;
          const showResult = selected !== null;
          const isWinner = showResult && winner === side;
          const isWrongPick = showResult && selected === side && winner !== side;

          let style = "border-border";
          if (showResult && isWinner) style = "border-care bg-care/40";
          else if (isWrongPick) style = "border-attention bg-attention/40";

          return (
            <button
              key={plant.id}
              onClick={() => handleSelect(side)}
              disabled={showResult}
              aria-label={`${plant.name} auswählen`}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-2 text-center transition-colors disabled:cursor-default ${style}`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-warm-white">
                {plant.imageUrl ? (
                  <Image
                    src={plant.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 220px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <span className="text-sm font-semibold text-forest">{plant.name}</span>
              {showResult && isWinner && (
                <span className="text-xs font-semibold text-care-text">✓ Richtig</span>
              )}
              {isWrongPick && <span className="text-xs font-semibold text-attention-text">✕ Falsch</span>}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-warm-white p-4 text-center">
          <p className="text-xs text-forest-muted">{explanation}</p>
          <button
            onClick={handleNextRound}
            className="flex min-h-11 items-center justify-center rounded-full bg-sage px-6 text-sm font-medium text-warm-white active:scale-95"
          >
            Nächste Runde
          </button>
        </div>
      )}
    </div>
  );
}
