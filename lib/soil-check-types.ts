export type SoilTexture = "sandig" | "sandig-lehmig" | "lehmig" | "tonig-lehmig" | "tonig";

export type PhClassification = "sauer" | "leicht sauer" | "neutral" | "leicht alkalisch" | "alkalisch";

export type DrainageClass = "schnell" | "mittel" | "langsam";

export type WaterRetentionClass = "gering" | "mittel" | "gut";

export type StoneContentClass = "kaum" | "einige" | "viele" | "sehr viele";

export type OrganicMatterIndicator = "mineralisch" | "erdig" | "humos" | "sehr humos" | "unbekannt";

export type ChoiceABC = "A" | "B" | "C";
export type ChoiceABCD = "A" | "B" | "C" | "D";
export type ChoiceABCDE = "A" | "B" | "C" | "D" | "E";

export type DrainageAnswer = {
  /** Immer 15 – Startwasserstand laut Anleitung. Als Wert gespeichert, falls sich das Protokoll später ändert. */
  startLevelCm: number;
  /** ISO-Timestamp, wann die Messung gestartet wurde – Grundlage für eine hintergrund-robuste Zeitberechnung. */
  startedAt: string;
  /** true, wenn der Nutzer "Loch bereits leer" gedrückt hat, bevor die 30 Minuten um waren. */
  finishedEarly: boolean;
  /** Tatsächlich vergangene Zeit bis zur Ablesung, in Minuten (kann durch Hintergrund/Displaysperre von der Anzeige abweichen – wird aus Zeitstempeln berechnet). */
  elapsedMinutes: number;
  /** Abgelesener verbleibender Wasserstand in cm. 0, wenn das Loch bereits leer war. */
  remainingLevelCm: number;
};

export type SoilCheckAnswers = {
  /** Screen 4 – Fühlen */
  feel: ChoiceABC;
  /** Screen 5 – Kugel formen */
  ball: ChoiceABC;
  /** Screen 6 – Rolle formen */
  roll: ChoiceABC;
  /** Screen 7 – Dünne Rolle */
  thinRoll: ChoiceABC;
  /** Screen 10 – Versickerung messen */
  drainage: DrainageAnswer;
  /** Screen 11 – abgelesener pH-Wert, in 0.5er-Schritten */
  ph: number;
  /** Screen 12 – Verhalten nach Regen */
  afterRain: ChoiceABCDE;
  /** Screen 13 – Verhalten bei Trockenheit (Mehrfachauswahl, "F" = weiss nicht, exklusiv) */
  drySpell: string[];
  /** Screen 14 – Steinanteil */
  stoneContent: ChoiceABCD;
  /** Screen 15 – organisches Material (Beobachtung, keine Messung) */
  organicMatter: ChoiceABCDE;
};

export type SoilProfile = {
  soilTexture: SoilTexture;
  phValue: number;
  phClassification: PhClassification;
  drainageClass: DrainageClass;
  /** Abgeleitete Versickerungsrate in cm/Stunde, sofern berechenbar. */
  infiltrationCmPerHour: number | null;
  waterRetentionClass: WaterRetentionClass;
  stoneContentClass: StoneContentClass;
  organicMatterIndicator: OrganicMatterIndicator;
  /** Regelbasiert zusammengesetzter, laienverständlicher Fliesstext ("Was bedeutet das für deinen Garten?"). */
  summaryText: string;
};
