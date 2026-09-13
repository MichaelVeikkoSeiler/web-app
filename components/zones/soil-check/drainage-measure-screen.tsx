"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { ScreenShell, Hint, OptionCard } from "@/components/zones/soil-check/soil-check-shells";
import type { DrainageAnswer } from "@/lib/soil-check-types";

const START_LEVEL_CM = 15;
const MEASURE_MINUTES = 30;
/** Obergrenze wie in der serverseitigen Plausibilitätsprüfung (submitSoilCheck). */
const MAX_MANUAL_MINUTES = 24 * 60;

type ManualOutcome = "leer" | "rest";

/** Akzeptiert Komma und Punkt als Dezimaltrenner ("12,5" wie "12.5"). */
function parseDecimal(input: string): number | null {
  const trimmed = input.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Misst die Versickerung robust über Zeitstempel statt über einen reinen
 * JS-Zähler: die Startzeit wird als Timestamp gehalten, die verstrichene
 * Zeit wird bei jedem Tick aus der Differenz zu Date.now() neu berechnet.
 * Dadurch bleibt die Messung korrekt, auch wenn das Display gesperrt war
 * oder der Tab im Hintergrund throttlet.
 *
 * Alternativ kann eine selbst gemessene Zeit eingetragen werden (z. B. mit
 * einer Stoppuhr, Durchschnitt über mehrere Löcher). Sie wird im selben
 * DrainageAnswer-Format gespeichert wie die Timer-Messung – Auswertung,
 * Datenbank und Plausibilitätsprüfung bleiben dadurch unverändert.
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
  const [manualMode, setManualMode] = useState(false);
  const [manualOutcome, setManualOutcome] = useState<ManualOutcome | null>(null);
  const [manualMinutesInput, setManualMinutesInput] = useState("");
  const [manualRemainingInput, setManualRemainingInput] = useState("");
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

  const manualMinutes = parseDecimal(manualMinutesInput);
  const manualRemaining = parseDecimal(manualRemainingInput);
  const manualMinutesValid = manualMinutes !== null && manualMinutes > 0 && manualMinutes <= MAX_MANUAL_MINUTES;
  const manualRemainingValid =
    manualRemaining !== null && manualRemaining >= 0 && manualRemaining <= START_LEVEL_CM;
  const manualValid =
    manualOutcome === "leer"
      ? manualMinutesValid
      : manualOutcome === "rest"
        ? manualMinutesValid && manualRemainingValid
        : false;

  function confirmManual() {
    if (!manualValid || manualMinutes === null) return;
    const remaining = manualOutcome === "rest" && manualRemaining !== null ? manualRemaining : 0;
    // Startzeitpunkt rückwärts aus der gemessenen Dauer ableiten, damit der
    // gespeicherte Datensatz in sich stimmig bleibt.
    const startedAt = new Date(Date.now() - manualMinutes * 60000);
    setStartedAtMs(startedAt.getTime());
    onChange({
      startLevelCm: START_LEVEL_CM,
      startedAt: startedAt.toISOString(),
      finishedEarly: manualOutcome === "leer",
      elapsedMinutes: manualMinutes,
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

  if (!startedAtMs && manualMode) {
    return (
      <ScreenShell
        title="Selbst gemessene Zeit eintragen"
        footer={
          <Button className="w-full" disabled={!manualValid} onClick={confirmManual}>
            Weiter
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-forest">
          Bei mehreren Löchern trägst du den Durchschnitt ein.{" "}
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="font-medium text-sage-dark underline underline-offset-4 hover:text-forest"
          >
            Doch mit der App messen
          </button>
        </p>

        <div className="flex flex-col gap-2">
          <OptionCard
            option={{ value: "leer", label: "Das Wasser ist vollständig versickert." }}
            selected={manualOutcome === "leer"}
            onClick={() => setManualOutcome("leer")}
          />
          <OptionCard
            option={{ value: "rest", label: "Nach meiner Messzeit stand noch Wasser im Loch." }}
            selected={manualOutcome === "rest"}
            onClick={() => setManualOutcome("rest")}
          />
        </div>

        {manualOutcome && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-forest">
                {manualOutcome === "leer"
                  ? "Nach wie vielen Minuten war das Loch leer?"
                  : "Wie lange hast du gemessen (in Minuten)?"}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={manualMinutesInput}
                onChange={(e) => setManualMinutesInput(e.target.value)}
                placeholder="z. B. 12,5"
                className={inputClasses}
              />
            </label>

            {manualOutcome === "rest" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-forest">Wie hoch stand das Wasser danach (in cm)?</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={manualRemainingInput}
                  onChange={(e) => setManualRemainingInput(e.target.value)}
                  placeholder="z. B. 4,5"
                  className={inputClasses}
                />
              </label>
            )}
          </div>
        )}

        <Hint>Gemessen ab 15 cm Füllhöhe – sonst stimmt die Auswertung nicht.</Hint>
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
        {/* Bewusst im Inhalt statt im Fussbereich: Unten würde ein zweiter Knopf
            auf dem Handy von der Navigationsleiste verdeckt. */}
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="self-start text-sm font-medium text-sage-dark underline underline-offset-4 hover:text-forest"
        >
          Zeit selbst gemessen? Ergebnis eintragen
        </button>
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
