import { monthRangeDuration, monthName } from "@/lib/date-utils";

export type PlantCompareRow = {
  id: number;
  name: string;
  imageUrl: string | null;
  bloomStartMonth: number | null;
  bloomEndMonth: number | null;
  wateringRhythmDays: number | null;
  careDifficulty: number | null;
};

export type PlantCompareField = {
  id: string;
  /** Frage-Text fürs Pflanzen-Match ("Welche Pflanze ...?"). */
  matchQuestion: string;
  /** Frage-Text für den Detektiv ("Welche deiner Pflanzen ...?"). */
  detektivQuestion: string;
  getValue: (p: PlantCompareRow) => number | null;
  /** "asc" = kleinerer Wert gewinnt, "desc" = grösserer Wert gewinnt. */
  direction: "asc" | "desc";
  format: (value: number) => string;
};

function bloomDuration(p: PlantCompareRow): number | null {
  if (!p.bloomStartMonth || !p.bloomEndMonth) return null;
  return monthRangeDuration(p.bloomStartMonth, p.bloomEndMonth);
}

export const plantCompareFields: PlantCompareField[] = [
  {
    id: "bloom-start",
    matchQuestion: "Welche Pflanze blüht früher im Jahr?",
    detektivQuestion: "Welche deiner Pflanzen blüht als Erste im Jahr?",
    getValue: (p) => p.bloomStartMonth,
    direction: "asc",
    format: (v) => `ab ${monthName(v)}`,
  },
  {
    id: "bloom-duration",
    matchQuestion: "Welche Pflanze blüht länger?",
    detektivQuestion: "Welche deiner Pflanzen blüht am längsten?",
    getValue: bloomDuration,
    direction: "desc",
    format: (v) => (v === 1 ? "1 Monat" : `${v} Monate`),
  },
  {
    id: "water-more",
    matchQuestion: "Welche Pflanze braucht mehr Wasser?",
    detektivQuestion: "Welche deiner Pflanzen braucht am meisten Wasser?",
    getValue: (p) => p.wateringRhythmDays,
    direction: "asc",
    format: (v) => `alle ${v} Tage`,
  },
  {
    id: "drought-tolerant",
    matchQuestion: "Welche Pflanze kommt besser mit Trockenheit zurecht?",
    detektivQuestion: "Welche deiner Pflanzen kommt am besten mit Trockenheit zurecht?",
    getValue: (p) => p.wateringRhythmDays,
    direction: "desc",
    format: (v) => `alle ${v} Tage`,
  },
  {
    id: "easy-care",
    matchQuestion: "Welche Pflanze ist pflegeleichter?",
    detektivQuestion: "Welche deiner Pflanzen ist am pflegeleichtesten?",
    getValue: (p) => p.careDifficulty,
    direction: "asc",
    format: (v) => `Pflegeaufwand ${v}/10`,
  },
];

export function isFieldAvailable(
  field: PlantCompareField,
  a: PlantCompareRow,
  b: PlantCompareRow,
): boolean {
  const va = field.getValue(a);
  const vb = field.getValue(b);
  return va != null && vb != null && va !== vb;
}

export function fieldWinner(
  field: PlantCompareField,
  a: PlantCompareRow,
  b: PlantCompareRow,
): "a" | "b" {
  const va = field.getValue(a)!;
  const vb = field.getValue(b)!;
  const aWins = field.direction === "asc" ? va < vb : va > vb;
  return aWins ? "a" : "b";
}

export function fieldExplanation(
  field: PlantCompareField,
  a: PlantCompareRow,
  b: PlantCompareRow,
): string {
  const va = field.getValue(a)!;
  const vb = field.getValue(b)!;
  return `${a.name}: ${field.format(va)} · ${b.name}: ${field.format(vb)}`;
}
