"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  InfoScreen,
  SingleChoiceScreen,
  MultiChoiceScreen,
  RetryScreen,
} from "@/components/zones/soil-check/soil-check-shells";
import { DrainageMeasureScreen } from "@/components/zones/soil-check/drainage-measure-screen";
import { PhScreen } from "@/components/zones/soil-check/ph-screen";
import { ResultScreen } from "@/components/zones/soil-check/result-screen";
import { submitSoilCheck } from "@/lib/actions/zone-soil-check";
import { evaluateSoilCheck, checkFormabilityPlausibility } from "@/lib/soil-check-logic";
import type { FormabilityPlausibility } from "@/lib/soil-check-logic";
import type { SoilCheckAnswers } from "@/lib/soil-check-types";

const BALL_STEP = 4;
const ROLL_STEP = 5;

const TOTAL_STEPS = 16;

type DraftAnswers = Partial<SoilCheckAnswers>;

export function SoilCheckWizard({ zoneId, zoneName }: { zoneId: number; zoneName: string }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryNotice, setRetryNotice] = useState<Extract<FormabilityPlausibility, { ok: false }> | null>(null);

  function set<K extends keyof SoilCheckAnswers>(key: K, value: SoilCheckAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    setStepIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1));
  }
  function back() {
    if (retryNotice) {
      setRetryNotice(null);
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleRollNext() {
    const check = checkFormabilityPlausibility({ ball: answers.ball, roll: answers.roll });
    if (!check.ok) {
      setRetryNotice(check);
      return;
    }
    next();
  }

  function handleThinRollNext() {
    const check = checkFormabilityPlausibility({ ball: answers.ball, roll: answers.roll, thinRoll: answers.thinRoll });
    if (!check.ok) {
      setRetryNotice(check);
      return;
    }
    next();
  }

  function retryFormabilityQuestion() {
    if (!retryNotice) return;
    if (retryNotice.retryQuestion === "ball") {
      setAnswers((prev) => ({ ...prev, ball: undefined, roll: undefined, thinRoll: undefined }));
      setStepIndex(BALL_STEP);
    } else {
      setAnswers((prev) => ({ ...prev, roll: undefined, thinRoll: undefined }));
      setStepIndex(ROLL_STEP);
    }
    setRetryNotice(null);
  }

  function dismissRetryNotice() {
    setRetryNotice(null);
    next();
  }

  function requestCancel() {
    setCancelOpen(true);
  }
  function confirmCancel() {
    router.push(`/zonen/${zoneId}`);
  }

  const profile = useMemo(() => {
    if (stepIndex !== 15) return null;
    return evaluateSoilCheck(answers as SoilCheckAnswers);
  }, [stepIndex, answers]);

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitSoilCheck(zoneId, answers as SoilCheckAnswers);
      router.push(`/zonen/${zoneId}`);
    } catch {
      setSubmitError("Der Bodencheck konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        {stepIndex > 0 ? (
          <button
            onClick={back}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest-muted hover:bg-cream"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-9 shrink-0" />
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-sage transition-all"
            style={{ width: `${((stepIndex + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <button
          onClick={requestCancel}
          aria-label="Bodencheck abbrechen"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest-muted hover:bg-cream"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {retryNotice ? (
        <RetryScreen
          reason={retryNotice.reason}
          retryLabel={retryNotice.retryQuestion === "ball" ? "Kugel-Probe wiederholen" : "Rolle-Probe wiederholen"}
          onRetry={retryFormabilityQuestion}
          onDismiss={dismissRetryNotice}
        />
      ) : (
        <>
      {stepIndex === 0 && (
        <InfoScreen
          title="Lerne deinen Boden kennen"
          paragraphs={[
            "Gemeinsam untersuchen wir Schritt für Schritt den Boden dieser Zone. Du brauchst dafür kein Vorwissen – beobachte einfach, was du siehst und fühlst.",
            "Wir nehmen eine Bodenprobe, fühlen und formen die Erde, testen die Versickerung und bestimmen den pH-Wert.",
          ]}
          materials={[
            "kleine Gartenschaufel",
            "sauberes Gefäss",
            "Wasser",
            "pH-Bodentest + destilliertes Wasser",
            "Massstab oder Meter",
          ]}
          hint="Plane ungefähr 20–30 Minuten ein."
          nextLabel="BodenCheck starten"
          footnote="Deine Ergebnisse werden am Ende der ausgewählten Gartenzone zugeordnet."
          onNext={next}
        />
      )}

      {stepIndex === 1 && (
        <InfoScreen
          title="Eine gute Bodenprobe nehmen"
          paragraphs={[
            "Damit wir nicht zufällig nur eine besondere Stelle erwischen, nehmen wir Erde von mehreren Stellen innerhalb dieser Zone.",
          ]}
          steps={[
            "Suche 3–5 unterschiedliche Stellen in der Zone.",
            "Schiebe Mulch, Laub und lose Pflanzenreste an der Oberfläche zur Seite.",
            "Entnimm an jeder Stelle etwas Erde aus ungefähr 10–15 cm Tiefe.",
            "Nimm jeweils ungefähr gleich viel Erde.",
            "Gib alles zusammen in dein sauberes Gefäss und vermische die Erde gründlich.",
          ]}
          hint="Diese Mischung ist unsere Bodenprobe und wird uns durch die nächsten Schritte begleiten."
          nextLabel="Bodenprobe ist bereit"
          onNext={next}
        />
      )}

      {stepIndex === 2 && (
        <InfoScreen
          title="Jetzt wird's praktisch"
          paragraphs={[
            "Nimm eine kleine Handvoll deiner gemischten Bodenprobe.",
            "Gib nach und nach ein paar Tropfen Wasser dazu und knete die Erde zwischen den Fingern.",
            "Sie ist richtig vorbereitet, wenn sie feucht und gut formbar ist – aber nicht nass oder matschig.",
          ]}
          hint="Zu nass geworden? Kein Problem. Nimm einfach etwas trockene Erde aus deiner Bodenprobe dazu."
          nextLabel="Erde ist bereit"
          onNext={next}
        />
      )}

      {stepIndex === 3 && (
        <SingleChoiceScreen
          title="Wie fühlt sich deine Erde an?"
          text="Reibe etwas von der feuchten Erde langsam zwischen Daumen und Zeigefinger. Welche Beschreibung passt am besten?"
          options={[
            { value: "A", label: "Deutlich körnig und rau – einzelne Körnchen sind gut spürbar" },
            { value: "B", label: "Weich und etwas körnig – weder besonders rau noch besonders glatt" },
            { value: "C", label: "Glatt und klebrig – die Erde schmiert deutlich zwischen den Fingern" },
          ]}
          value={answers.feel}
          onChange={(v) => set("feel", v)}
          hint="Es gibt kein richtig oder falsch. Wähle einfach das, was deiner Wahrnehmung am nächsten kommt."
          onNext={next}
        />
      )}

      {stepIndex === 4 && (
        <SingleChoiceScreen
          title="Lässt sich die Erde formen?"
          text="Nimm die feuchte Erde in die Hand und versuche, daraus eine kleine Kugel zu formen – ungefähr so gross wie eine Walnuss."
          options={[
            { value: "A", label: "Sie zerfällt immer wieder – eine Kugel lässt sich kaum formen" },
            { value: "B", label: "Eine Kugel entsteht, ist aber eher locker und bröckelig" },
            { value: "C", label: "Die Kugel hält gut zusammen und lässt sich problemlos formen" },
          ]}
          value={answers.ball}
          onChange={(v) => set("ball", v)}
          hint="Nicht extra fest zusammendrücken. Forme sie einfach locker zwischen deinen Händen."
          onNext={next}
        />
      )}

      {stepIndex === 5 && (
        <SingleChoiceScreen
          title="Wie gut lässt sich die Erde rollen?"
          text="Nimm die Kugel und rolle sie vorsichtig zwischen deinen Handflächen zu einer etwa bleistiftdicken Rolle."
          options={[
            { value: "A", label: "Die Erde zerfällt sofort – eine Rolle ist nicht möglich" },
            { value: "B", label: "Eine kurze Rolle entsteht, sie bekommt aber schnell Risse und bricht" },
            { value: "C", label: "Die Erde lässt sich gut zu einer längeren, stabilen Rolle formen" },
          ]}
          value={answers.roll}
          onChange={(v) => set("roll", v)}
          hint="Nicht stärker drücken, nur weil die Rolle auseinanderfällt. Genau dieses Verhalten hilft uns, deinen Boden einzuschätzen."
          onNext={handleRollNext}
        />
      )}

      {stepIndex === 6 && (
        <SingleChoiceScreen
          title="Wie weit kannst du gehen?"
          text="Versuche jetzt, deine Rolle vorsichtig noch etwas dünner zu rollen – ungefähr auf die Dicke eines Stiftes oder etwas dünner."
          options={[
            { value: "A", label: "Sie bricht sofort auseinander" },
            { value: "B", label: "Sie wird dünner, bekommt aber deutliche Risse und bricht bald" },
            { value: "C", label: "Sie lässt sich sehr dünn rollen und bleibt dabei stabil" },
          ]}
          value={answers.thinRoll}
          onChange={(v) => set("thinRoll", v)}
          hint="Damit haben wir die Fingerprobe geschafft. Aus deinen Beobachtungen kann die App die Bodenart ableiten."
          onNext={handleThinRollNext}
        />
      )}

      {stepIndex === 7 && (
        <InfoScreen
          title="Wie gut kann Wasser versickern?"
          paragraphs={[
            "Als Nächstes untersuchen wir, wie schnell Wasser im Boden dieser Zone versickert.",
            "Dafür brauchen wir die Bodenprobe nicht. Wir machen den Test direkt in der Erde.",
          ]}
          steps={[
            "Grabe ein Loch: ungefähr 20 cm tief, ungefähr 15–20 cm breit.",
            "Versuche, die Seiten und den Boden des Lochs beim Graben nicht unnötig festzudrücken.",
          ]}
          hint="So erfahren wir, ob Wasser schnell abfliesst oder länger im Boden bleibt. Das ist später wichtig für die Wahl und Pflege deiner Pflanzen."
          nextLabel="Loch ist bereit"
          onNext={next}
        />
      )}

      {stepIndex === 8 && (
        <InfoScreen
          title="Bereite den Boden auf die Messung vor"
          paragraphs={["Fülle das Loch jetzt einmal vollständig mit Wasser.", "Lass das Wasser komplett versickern. Das kann je nach Boden etwas dauern."]}
          hint="Trockener Boden kann Wasser anfangs ungewöhnlich schnell aufnehmen. Durch das Vorwässern starten wir die eigentliche Messung unter vergleichbareren Bedingungen."
          nextLabel="Wasser ist versickert"
          onNext={next}
        />
      )}

      {stepIndex === 9 && (
        <DrainageMeasureScreen value={answers.drainage} onChange={(v) => set("drainage", v)} onNext={next} />
      )}

      {stepIndex === 10 && <PhScreen value={answers.ph} onChange={(v) => set("ph", v)} onNext={next} />}

      {stepIndex === 11 && (
        <SingleChoiceScreen
          title="Wie verhält sich diese Zone nach Regen?"
          text="Denk an einen normalen kräftigen Regentag. Was beobachtest du anschliessend meistens?"
          options={[
            { value: "A", label: "Der Boden trocknet sehr schnell wieder ab" },
            { value: "B", label: "Der Boden bleibt eine Weile angenehm feucht" },
            { value: "C", label: "Der Boden bleibt lange sehr feucht oder nass" },
            { value: "D", label: "Manchmal bleibt sogar Wasser auf der Oberfläche stehen" },
            { value: "E", label: "Weiss ich nicht / noch nie darauf geachtet" },
          ]}
          value={answers.afterRain}
          onChange={(v) => set("afterRain", v)}
          onNext={next}
        />
      )}

      {stepIndex === 12 && (
        <MultiChoiceScreen
          title="Und wie verhält sich der Boden im Sommer?"
          text="Denk an eine längere warme und trockene Phase. Was trifft auf diese Zone am ehesten zu?"
          options={[
            { value: "A", label: "Der Boden trocknet sehr schnell aus und wird locker/staubig" },
            { value: "B", label: "Der Boden trocknet langsam und gleichmässig ab" },
            { value: "C", label: "Der Boden wird beim Austrocknen sehr hart und fest" },
            { value: "D", label: "Es entstehen teilweise sichtbare Risse im Boden" },
            { value: "E", label: "Der Boden bleibt erstaunlich lange feucht" },
            { value: "F", label: "Weiss ich nicht / noch nie darauf geachtet" },
          ]}
          exclusiveValue="F"
          value={answers.drySpell ?? []}
          onChange={(v) => set("drySpell", v)}
          onNext={next}
        />
      )}

      {stepIndex === 13 && (
        <SingleChoiceScreen
          title="Wie steinig ist dein Boden?"
          text="Schau dir deine gemischte Bodenprobe und das Loch vom Versickerungstest an. Wie viele Steine und gröbere Bestandteile findest du?"
          options={[
            { value: "A", label: "Fast keine – überwiegend feine Erde" },
            { value: "B", label: "Einige – beim Graben immer wieder einzelne Steine" },
            { value: "C", label: "Viele – ein deutlicher Teil des Bodens besteht aus Steinen" },
            { value: "D", label: "Sehr viele – das Graben wird durch Steine deutlich erschwert" },
          ]}
          value={answers.stoneContent}
          onChange={(v) => set("stoneContent", v)}
          hint="Steine sind nicht automatisch schlecht. Sie beeinflussen unter anderem, wie viel Wasser der Boden speichern kann."
          onNext={next}
        />
      )}

      {stepIndex === 14 && (
        <SingleChoiceScreen
          title="Wie wirkt deine Erde?"
          text="Schau dir deine gemischte Bodenprobe genauer an und zerreibe etwas davon zwischen den Fingern."
          options={[
            { value: "A", label: "Eher hell und mineralisch – kaum Pflanzenreste erkennbar" },
            { value: "B", label: "Braun und typisch erdig – einzelne feine Pflanzenreste oder Wurzeln sichtbar" },
            { value: "C", label: "Dunkel und locker – deutlich organisches Material und Pflanzenreste erkennbar" },
            { value: "D", label: "Sehr dunkel, locker und humusartig" },
            { value: "E", label: "Kann ich nicht einschätzen" },
          ]}
          value={answers.organicMatter}
          onChange={(v) => set("organicMatter", v)}
          hint="Die Farbe allein sagt noch nicht sicher, wie humusreich ein Boden ist. Deshalb verwenden wir diese Beobachtung nur als Hinweis und nicht als exakte Humusmessung."
          onNext={next}
        />
      )}

      {stepIndex === 15 && profile && (
        <ResultScreen
          zoneName={zoneName}
          profile={profile}
          submitting={submitting}
          error={submitError}
          onConfirm={handleConfirm}
        />
      )}
        </>
      )}

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Bodencheck abbrechen?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-forest-muted">
            Deine bisherigen Antworten gehen verloren. Es wird nichts gespeichert.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelOpen(false)}>
              Weitermachen
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmCancel}>
              Abbrechen
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
