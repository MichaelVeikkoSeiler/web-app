import type {
  ChoiceABC,
  DrainageAnswer,
  DrainageClass,
  OrganicMatterIndicator,
  PhClassification,
  SoilCheckAnswers,
  SoilProfile,
  SoilTexture,
  StoneContentClass,
  WaterRetentionClass,
} from "@/lib/soil-check-types";

/**
 * Zentrale, deterministische Auswertung des BodenChecks. Bewusst OHNE
 * OpenAI/KI – alles hier ist eine dokumentierte, nachvollziehbare Regel,
 * damit wir sie später anpassen können, ohne Nutzer den Check erneut
 * durchführen zu lassen (die Rohantworten bleiben ja in `answers` erhalten).
 *
 * Alle Schwellenwerte sind bewusst grobe, praxistaugliche Gartenfaustregeln
 * und erheben keinen Anspruch auf Laborgenauigkeit.
 */

// ---------------------------------------------------------------------------
// Bodenart aus der Finger-/Rollprobe (Screens 4–7)
// ---------------------------------------------------------------------------
//
// Entscheidungsbaum statt Punktesumme. Hauptkriterium ist die Formbarkeit,
// abgefragt als aufeinander aufbauende Stufen Kugel -> Rolle -> dünne Rolle:
//
//   Kugel kaum formbar               -> Tendenz sandig
//   Kugel ok, Rolle zerfällt         -> Tendenz sandig-lehmig
//   Rolle ok, dünne Rolle bricht/Risse -> Tendenz lehmig
//   dünne Rolle bleibt stabil        -> Tendenz tonig-lehmig bis tonig
//
// Die Fühlprobe ("Wie fühlt sich die Erde an?") ist ein ergänzendes, bewusst
// schwächer gewichtetes Kriterium. Sie wird nur herangezogen, um innerhalb
// von lehmig/tonig-lehmig/tonig eine Stufe HÖHER (mehr Ton) zu gehen, nie
// um die Formbarkeits-Einstufung nach unten zu korrigieren – die Formbarkeit
// bleibt damit immer die harte Untergrenze. "tonig" wird ausschliesslich
// erreicht, wenn sowohl die dünne Rolle stabil ist ALS AUCH die Fühlprobe
// deutlich glatt/klebrig ausfällt (feel === "C"); jede andere Kombination
// bleibt bei der breiteren Zwischenkategorie "tonig-lehmig", statt eine
// Genauigkeit vorzutäuschen, die die Beobachtungen nicht hergeben.

function deriveTextureFromFormability(ball: ChoiceABC, roll: ChoiceABC, thinRoll: ChoiceABC): SoilTexture {
  if (ball === "A") return "sandig";
  if (roll === "A") return "sandig-lehmig";
  if (thinRoll !== "C") return "lehmig"; // dünne Rolle bekommt Risse oder bricht (A oder B)
  return "tonig-lehmig"; // dünne Rolle bleibt stabil -> Kandidat für tonig-lehmig/tonig
}

export function deriveSoilTexture(answers: Pick<SoilCheckAnswers, "feel" | "ball" | "roll" | "thinRoll">): SoilTexture {
  const baseTexture = deriveTextureFromFormability(answers.ball, answers.roll, answers.thinRoll);

  // Fühlprobe als sekundäres Kriterium: kann lehmig -> tonig-lehmig -> tonig
  // um jeweils eine Stufe anheben, aber nie herabstufen.
  if (baseTexture === "lehmig" && answers.feel === "C") return "tonig-lehmig";
  if (baseTexture === "tonig-lehmig" && answers.feel === "C") return "tonig";
  return baseTexture;
}

// ---------------------------------------------------------------------------
// Plausibilitätsprüfung der Formbarkeits-Abfolge
// ---------------------------------------------------------------------------
//
// Kugel -> Rolle -> dünne Rolle ist eine physikalisch aufeinander aufbauende
// Prüfreihe: wer nicht einmal eine Kugel formen kann, kann folgerichtig auch
// keine Rolle formen, und wer keine Rolle formen kann, kann keine stabile
// DÜNNE Rolle formen. Widerspricht eine spätere Antwort dieser Erwartung
// deutlich, wird das nicht stillschweigend über die Formbarkeits-Stufe
// "aufgelöst" (das würde die widersprüchliche spätere Antwort einfach
// ignorieren) – stattdessen wird erkannt, dass eine der beiden beteiligten
// Proben wahrscheinlich falsch beantwortet oder missverstanden wurde, und
// der Wizard bietet an, die frühere (grundlegendere) Probe zu wiederholen.
// Leichtere Abweichungen (z.B. Rolle nicht möglich, dünne Rolle "bricht bald"
// statt "sofort") lösen bewusst KEINE Wiederholung aus – das ist im Rahmen
// der ohnehin groben Einschätzung normal und wird von der Formbarkeits-Stufe
// selbst schon korrekt aufgefangen.

export type FormabilityRetryQuestion = "ball" | "roll";

export type FormabilityPlausibility =
  | { ok: true }
  | { ok: false; retryQuestion: FormabilityRetryQuestion; reason: string };

export function checkFormabilityPlausibility(
  answers: Partial<Pick<SoilCheckAnswers, "ball" | "roll" | "thinRoll">>,
): FormabilityPlausibility {
  const ballFormable = answers.ball !== undefined && answers.ball !== "A";
  const rollFormable = answers.roll !== undefined && answers.roll !== "A";
  const thinRollStable = answers.thinRoll === "C";

  if (answers.ball !== undefined && answers.roll !== undefined && !ballFormable && rollFormable) {
    return {
      ok: false,
      retryQuestion: "ball",
      reason: "Eine Rolle war möglich, obwohl sich zuvor kaum eine Kugel formen liess.",
    };
  }

  if (answers.roll !== undefined && answers.thinRoll !== undefined && !rollFormable && thinRollStable) {
    return {
      ok: false,
      retryQuestion: "roll",
      reason: "Die dünne Rolle blieb stabil, obwohl zuvor gar keine Rolle möglich war.",
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// pH-Wert (Screen 11)
// ---------------------------------------------------------------------------
//
// Einfache, symmetrisch um pH 7 (neutral) gelegte Gartenfaustregel-Bänder.
// Kein wissenschaftlicher Standard, aber für eine Garteneinschätzung üblich
// und für Laien gut nachvollziehbar.

export function classifyPh(phValue: number): PhClassification {
  if (phValue < 5.5) return "sauer";
  if (phValue < 6.5) return "leicht sauer";
  if (phValue <= 7.5) return "neutral";
  if (phValue <= 8.5) return "leicht alkalisch";
  return "alkalisch";
}

// ---------------------------------------------------------------------------
// Drainage / Versickerung (Screen 10)
// ---------------------------------------------------------------------------
//
// Aus Startwasserstand (immer 15 cm), verbleibendem Wasserstand und
// vergangener Zeit wird eine Versickerungsrate in cm/Stunde berechnet.
// Schwellenwerte orientieren sich an gängigen Gartenfaustregeln zur
// Sickergeschwindigkeit (z.B. "mehrere cm pro Stunde = gut durchlässig",
// "unter ca. 1 cm pro Stunde = eher stauend").

const DRAINAGE_FAST_CM_PER_HOUR = 5;
const DRAINAGE_SLOW_CM_PER_HOUR = 1.25;

export function calculateInfiltrationRate(drainage: DrainageAnswer): number | null {
  const elapsedHours = drainage.elapsedMinutes / 60;
  if (elapsedHours <= 0) return null;
  const drainedCm = drainage.startLevelCm - drainage.remainingLevelCm;
  if (drainedCm <= 0) return 0;
  return drainedCm / elapsedHours;
}

export function classifyDrainage(rateCmPerHour: number | null): DrainageClass {
  if (rateCmPerHour == null) return "mittel"; // konservativ, wenn nicht berechenbar
  if (rateCmPerHour >= DRAINAGE_FAST_CM_PER_HOUR) return "schnell";
  if (rateCmPerHour < DRAINAGE_SLOW_CM_PER_HOUR) return "langsam";
  return "mittel";
}

// ---------------------------------------------------------------------------
// Steinanteil (Screen 14) und organisches Material (Screen 15)
// ---------------------------------------------------------------------------
// Direkte, unzweideutige Zuordnung der Antwortoption zur Kategorie.

export function classifyStoneContent(choice: SoilCheckAnswers["stoneContent"]): StoneContentClass {
  return { A: "kaum", B: "einige", C: "viele", D: "sehr viele" }[choice] as StoneContentClass;
}

/**
 * Bewusst als "Hinweis" benannt, nicht als gemessener Humusgehalt – die
 * optische Einschätzung der Bodenprobe ist kein verlässliches Messverfahren.
 */
export function deriveOrganicMatterIndicator(
  choice: SoilCheckAnswers["organicMatter"],
): OrganicMatterIndicator {
  return { A: "mineralisch", B: "erdig", C: "humos", D: "sehr humos", E: "unbekannt" }[
    choice
  ] as OrganicMatterIndicator;
}

// ---------------------------------------------------------------------------
// Wasserspeicherung (Screen 22 der Spezifikation)
// ---------------------------------------------------------------------------
//
// Bewusst aus mehreren Beobachtungen zusammengesetzt (nicht aus nur einer
// Antwort): Bodenart, Drainage, Verhalten nach Regen, Verhalten bei
// Trockenheit und Steinanteil fliessen als Punkte in einen Score ein.
// "Weiss ich nicht"-Antworten tragen bewusst 0 Punkte bei (neutral), damit
// fehlendes Wissen die Einschätzung nicht verzerrt. Bei überwiegend
// neutralen/fehlenden Angaben bleibt der Score nahe 0 und landet damit in
// der konservativen "mittel"-Kategorie statt an einem Extrem.

function textureRetentionPoints(texture: SoilTexture): number {
  if (texture === "sandig" || texture === "sandig-lehmig") return -1;
  if (texture === "tonig-lehmig" || texture === "tonig") return 1;
  return 0; // lehmig
}

function drainageRetentionPoints(drainage: DrainageClass): number {
  if (drainage === "schnell") return -1;
  if (drainage === "langsam") return 1;
  return 0;
}

function afterRainPoints(answer: SoilCheckAnswers["afterRain"]): number {
  return { A: -1, B: 0, C: 1, D: 2, E: 0 }[answer];
}

function drySpellPoints(answers: string[]): number {
  if (answers.includes("F")) return 0; // "weiss ich nicht" -> neutral, exklusiv
  let points = 0;
  if (answers.includes("A")) points -= 1; // trocknet sehr schnell aus
  if (answers.includes("E")) points += 1; // bleibt erstaunlich lange feucht
  return points;
}

function stoneRetentionPoints(stoneContent: StoneContentClass): number {
  return stoneContent === "viele" || stoneContent === "sehr viele" ? -1 : 0;
}

export function deriveWaterRetention(input: {
  soilTexture: SoilTexture;
  drainageClass: DrainageClass;
  afterRain: SoilCheckAnswers["afterRain"];
  drySpell: string[];
  stoneContentClass: StoneContentClass;
}): WaterRetentionClass {
  const score =
    textureRetentionPoints(input.soilTexture) +
    drainageRetentionPoints(input.drainageClass) +
    afterRainPoints(input.afterRain) +
    drySpellPoints(input.drySpell) +
    stoneRetentionPoints(input.stoneContentClass);

  if (score <= -2) return "gering";
  if (score >= 2) return "gut";
  return "mittel";
}

// ---------------------------------------------------------------------------
// Zusammenfassungstext ("Was bedeutet das für deinen Garten?")
// ---------------------------------------------------------------------------
// Regelbasiert aus vorbereiteten Textbausteinen, bewusst zurückhaltend
// formuliert (keine übertriebenen/wissenschaftlich nicht gedeckten Aussagen).

const TEXTURE_BLURB: Record<SoilTexture, string> = {
  sandig:
    "Dein Boden ist eher sandig: Wasser und Nährstoffe versickern schnell. Regelmässiges, dafür sparsames Giessen sowie das Einarbeiten von Kompost helfen, Wasser und Nährstoffe besser zu halten.",
  "sandig-lehmig":
    "Dein Boden ist sandig-lehmig: eine gute Mischung aus Durchlässigkeit und etwas Halt. Er lässt sich in der Regel angenehm bearbeiten.",
  lehmig:
    "Dein Boden ist lehmig – für die meisten Gartenpflanzen ein guter Mittelweg aus Durchlässigkeit, Wasser- und Nährstoffspeicherung.",
  "tonig-lehmig":
    "Dein Boden ist tonig-lehmig: Er speichert Wasser und Nährstoffe gut, kann bei Nässe aber leichter verdichten. Vorsichtiges Lockern und organisches Material helfen der Struktur.",
  tonig:
    "Dein Boden ist eher tonig: Er speichert Wasser und Nährstoffe sehr gut, neigt bei Nässe aber zu Verdichtung und Staunässe. Lockerung und organisches Material sind hier besonders wertvoll.",
};

const DRAINAGE_BLURB: Record<DrainageClass, string> = {
  schnell: "Wasser versickert bei dir schnell – gut gegen Staunässe, dafür trocknet der Boden auch rascher wieder ab.",
  mittel: "Die Versickerung ist mittel – für die meisten Pflanzen ein unproblematischer Wert.",
  langsam:
    "Wasser versickert eher langsam. Achte bei empfindlichen Pflanzen auf Staunässe, etwa durch lockernde Massnahmen oder erhöhte Beete.",
};

const RETENTION_BLURB: Record<WaterRetentionClass, string> = {
  gering: "Insgesamt hält dieser Boden Wasser nur kurz – häufigeres, dafür massvolles Giessen ist sinnvoll.",
  mittel: "Insgesamt speichert dieser Boden Wasser in einem ausgewogenen Mass.",
  gut: "Insgesamt speichert dieser Boden Wasser gut – das reduziert den Giessaufwand, erhöht aber bei Nässe das Risiko von Staunässe.",
};

export function buildSummaryText(profile: {
  soilTexture: SoilTexture;
  phClassification: PhClassification;
  drainageClass: DrainageClass;
  waterRetentionClass: WaterRetentionClass;
}): string {
  const parts = [
    TEXTURE_BLURB[profile.soilTexture],
    DRAINAGE_BLURB[profile.drainageClass],
    RETENTION_BLURB[profile.waterRetentionClass],
    `Der pH-Wert deutet auf ${profile.phClassification === "neutral" ? "einen neutralen Boden" : `einen ${profile.phClassification}en Boden`} hin – das beeinflusst, welche Pflanzen sich hier besonders wohlfühlen.`,
  ];
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Orchestrierung
// ---------------------------------------------------------------------------

const PH_MIN = 3;
const PH_MAX = 10;

export function evaluateSoilCheck(answers: SoilCheckAnswers): SoilProfile {
  const phValue = Math.min(PH_MAX, Math.max(PH_MIN, answers.ph));
  const soilTexture = deriveSoilTexture(answers);
  const infiltrationCmPerHour = calculateInfiltrationRate(answers.drainage);
  const drainageClass = classifyDrainage(infiltrationCmPerHour);
  const stoneContentClass = classifyStoneContent(answers.stoneContent);
  const waterRetentionClass = deriveWaterRetention({
    soilTexture,
    drainageClass,
    afterRain: answers.afterRain,
    drySpell: answers.drySpell,
    stoneContentClass,
  });
  const organicMatterIndicator = deriveOrganicMatterIndicator(answers.organicMatter);
  const phClassification = classifyPh(phValue);

  return {
    soilTexture,
    phValue,
    phClassification,
    drainageClass,
    infiltrationCmPerHour,
    waterRetentionClass,
    stoneContentClass,
    organicMatterIndicator,
    summaryText: buildSummaryText({ soilTexture, phClassification, drainageClass, waterRetentionClass }),
  };
}
