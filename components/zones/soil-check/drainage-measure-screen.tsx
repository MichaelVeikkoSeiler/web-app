"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { ScreenShell, Hint } from "@/components/zones/soil-check/soil-check-shells";
import type { DrainageAnswer } from "@/lib/soil-check-types";

const START_LEVEL_CM = 15;
const MEASURE_MINUTES = 30;

/**
 * Misst die Versickerung robust über Zeitstempel statt über einen reinen
 * JS-Zähler: die Startzeit wird als Timestamp gehalten, die verstrichene
 * Zeit wird bei jedem Tick aus der Differenz zu Date.now() neu berechnet.
 * Dadurch bleibt die Messung korrekt, auch wenn das Display gesperrt war
 * oder der Tab im Hintergrund throttlet.
 */
export function DrainageMeasureScreen({
  value,
  onChange,
  onNext,
}: {
  value: DrainageAnswer | undefined;
  onChange: (value: DrainageAnswer) => void;
  onNext: () => void;
}) {
  const [startedAtMs, setStartedAtMs] = useState<number | null>(
    value ? new Date(value.startedAt).getTime() : null,
  );
  const [now, setNow] = useState(() => Date.now());
  const [remainingInput, setRemainingInput] = useState(
    value && !value.finishedEarly ? String(value.remainingLevelCm) : "",
  );
  const done = Boolean(value);

  useEffect(() => {
    if (!startedAtMs || done) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [startedAtMs, done]);

  const elapsedMinutes = startedAtMs ? (now - startedAtMs) / 60000 : 0;
  const reached30 = elapsedMinutes >= MEASURE_MINUTES;
  const minutesLeft = Math.max(0, Math.ceil(MEASURE_MINUTES - elapsedMinutes));

  function start() {
    const ts = Date.now();
    setStartedAtMs(ts);
    setNow(ts);
  }

  function finishEarly() {
    if (!startedAtMs) return;
    const elapsed = (Date.now() - startedAtMs) / 60000;
    onChange({
      startLevelCm: START_LEVEL_CM,
      startedAt: new Date(startedAtMs).toISOString(),
      finishedEarly: true,
      elapsedMinutes: elapsed,
      remainingLevelCm: 0,
    });
  }

  function confirmRemaining() {
    if (!startedAtMs) return;
    const remaining = Number(remainingInput);
    if (!Number.isFinite(remaining) || remaining < 0 || remaining > START_LEVEL_CM) return;
    const elapsed = (Date.now() - startedAtMs) / 60000;
    onChange({
      startLevelCm: START_LEVEL_CM,
      startedAt: new Date(startedAtMs).toISOString(),
      finishedEarly: false,
      elapsedMinutes: elapsed,
      remainingLevelCm: remaining,
    });
  }

  const remainingValid =
    remainingInput.trim() !== "" &&
    Number.isFinite(Number(remainingInput)) &&
    Number(remainingInput) >= 0 &&
    Number(remainingInput) <= START_LEVEL_CM;

  if (done && value) {
    return (
      <ScreenShell
        title="Messung abgeschlossen"
        footer={
          <Button className="w-full" onClick={onNext}>
            Weiter
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-forest">
          {value.finishedEarly
            ? `Das Wasser war nach ca. ${Math.round(value.elapsedMinutes)} ${Math.round(value.elapsedMinutes) === 1 ? "Minute" : "Minuten"} vollständig versickert.`
            : `Nach ${Math.round(value.elapsedMinutes)} ${Math.round(value.elapsedMinutes) === 1 ? "Minute" : "Minuten"} standen noch ca. ${value.remainingLevelCm} cm Wasser im Loch.`}
        </p>
      </ScreenShell>
    );
  }

  if (!startedAtMs) {
    return (
      <ScreenShell
        title="Jetzt wird gemessen"
        footer={
          <Button className="w-full" onClick={start}>
            Messung starten
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-forest">
          Fülle das Loch erneut mit Wasser, bis der Wasserstand 15 cm hoch ist. Halte deinen Massstab senkrecht ins
          Loch und kontrolliere die Füllhöhe.
        </p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Wasser versickert"
      footer={
        <div className="flex flex-col gap-2">
          {reached30 ? (
            <>
              <p className="text-sm font-medium text-forest">Wie hoch steht das Wasser jetzt?</p>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={START_LEVEL_CM}
                step={0.5}
                value={remainingInput}
                onChange={(e) => setRemainingInput(e.target.value)}
                placeholder="Wasserstand in cm"
                className={inputClasses}
              />
              <Button className="w-full" disabled={!remainingValid} onClick={confirmRemaining}>
                Weiter
              </Button>
            </>
          ) : (
            <Button variant="secondary" className="w-full" onClick={finishEarly}>
              Loch bereits leer
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-warm-white p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-sage-dark" />
        {reached30 ? (
          <p className="text-sm text-forest-muted">Die 30 Minuten sind um.</p>
        ) : (
          <>
            <p className="font-display text-2xl text-forest">Noch ca. {minutesLeft} Min.</p>
            <p className="text-sm text-forest-muted">Wir fragen in 30 Minuten nach dem Wasserstand.</p>
          </>
        )}
      </div>
      <Hint>
        Du kannst währenddessen dein Display sperren oder die App in den Hintergrund legen – die Zeit läuft korrekt
        weiter, solange dieser Browser-Tab geöffnet bleibt.
      </Hint>
    </ScreenShell>
  );
}
