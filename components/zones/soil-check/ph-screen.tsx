"use client";

import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell, Hint } from "@/components/zones/soil-check/soil-check-shells";

const PH_MIN = 3.5;
const PH_MAX = 9;
const PH_STEP = 0.5;
const PH_DEFAULT = 7;

export function PhScreen({
  value,
  onChange,
  onNext,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  onNext: () => void;
}) {
  useEffect(() => {
    if (value == null) onChange(PH_DEFAULT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = value ?? PH_DEFAULT;

  function adjust(delta: number) {
    const next = Math.round((current + delta) * 10) / 10;
    onChange(Math.min(PH_MAX, Math.max(PH_MIN, next)));
  }

  return (
    <ScreenShell
      title="Wie sauer oder kalkhaltig ist dein Boden?"
      footer={
        <Button className="w-full" onClick={onNext}>
          Weiter
        </Button>
      }
    >
      <p className="text-sm leading-relaxed text-forest">
        Jetzt verwenden wir einen Boden-pH-Test. Nimm dafür wieder etwas Erde aus deiner gemischten Bodenprobe. Führe
        den Test genau nach der Anleitung deines Testkits durch. Die benötigte Menge Erde, Wasser und Reagenz kann je
        nach Hersteller unterschiedlich sein.
      </p>
      <Hint>
        Verwende bei einem Test, der Wasser benötigt, destilliertes Wasser, sofern dies die Anleitung deines Testkits
        vorsieht.
      </Hint>
      <p className="text-sm leading-relaxed text-forest">
        Vergleiche die entstandene Farbe mit der Farbskala deines Tests. Welchen pH-Wert hast du abgelesen?
      </p>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-6">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => adjust(-PH_STEP)}
            disabled={current <= PH_MIN}
            aria-label="Niedrigerer pH-Wert"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-forest hover:border-sage disabled:opacity-40"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="font-display text-4xl text-forest">{current.toFixed(1)}</span>
          <button
            type="button"
            onClick={() => adjust(PH_STEP)}
            disabled={current >= PH_MAX}
            aria-label="Höherer pH-Wert"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-forest hover:border-sage disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-forest-muted">
        Du musst nicht wissen, was dieser Wert bedeutet. Die App ordnet ihn für dich ein.
      </p>
    </ScreenShell>
  );
}
