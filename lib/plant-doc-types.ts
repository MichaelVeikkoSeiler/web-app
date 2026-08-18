export const PLANT_DOC_MAX_PHOTOS = 3;

export type PlantDocAnswers = {
  /** Blätter | Blüten | Stamm/Äste | gesamte Pflanze | Schädlinge sichtbar */
  location: string[];
  /** gelbe Blätter | braune Stellen | Flecken | Löcher/Frassspuren | eingerollte Blätter | welk | trockene Triebe | Belag | unbekannt */
  observations: string[];
  /** heute entdeckt | wenige Tage | 1–2 Wochen | länger */
  sinceWhen: string;
  freeText: string | null;
};

export type PlantDocContext = {
  plant: {
    scientificName: string;
    germanName: string | null;
    commonName: string | null;
    wateringRhythmDays: number | null;
    wateringNotes: string | null;
    lastWateredAt: string | null;
    bloomPeriodText: string | null;
    pruningPeriodText: string | null;
    lastPrunedAt: string | null;
    fertilizingPeriodText: string | null;
    lastFertilizedAt: string | null;
    isFruitOrBerry: boolean;
  };
  zones: {
    name: string;
    light: string;
    orientation: string;
    soilType: string | null;
    notes: string | null;
  }[];
  weather: {
    last14Days: {
      date: string;
      tempMax: number;
      tempMin: number;
      precipitationSum: number;
      weatherCode: number;
    }[];
    precipitationLast7Days: number;
  } | null;
  previousCases: {
    date: string;
    primaryCause: string | null;
    status: string;
  }[];
};

export type PlantDocAiResult = {
  primaryCause: string | null;
  primaryCauseCategory: string | null;
  confidence: string | null;
  reasoning: string | null;
  otherCauses: string[];
  recommendations: string[];
  recheckAfterDays: number | null;
  needsMoreInfo: boolean;
  missingInfoSuggestions: string[];
  usedWebSearch: boolean;
};
