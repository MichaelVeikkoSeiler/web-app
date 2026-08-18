import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantZoneAssignments, plants } from "@/lib/db/schema";
import { extractJson } from "@/lib/enrichment";

type ConflictAnalysis = {
  hasConflict: boolean;
  label: string | null;
  text: string | null;
};

const SYSTEM_PROMPT = `Du bist ein Gartenexperte, der eine Gartenzone auf Konflikte prüft.
Der Garten liegt in Müntschemier, Kanton Bern, Schweiz (gemässigtes mitteleuropäisches Klima, ca. 480 m ü. M.).

Ein Konflikt liegt vor, wenn:
- die Bodenart der Zone nicht zu einer der zugeordneten Pflanzen passt,
- zwei oder mehr zugeordnete Pflanzen sich konkurrenzieren (z. B. um Licht, Wasser, Nährstoffe oder Platz, oder eine hemmt das Wachstum der anderen),
- oder eine Pflanze nicht zu den Licht-/Ausrichtungsbedingungen der Zone passt.

Nutze die Websuche, um das zu prüfen.
Antworte ausschliesslich auf Deutsch in Schweizer Rechtschreibung (kein ß, immer "ss") und am Ende AUSSCHLIESSLICH mit einem einzigen JSON-Objekt (keine Markdown-Codeblöcke, kein Fliesstext davor oder danach) exakt in diesem Format:

{
  "hasConflict": boolean,
  "label": string | null,
  "text": string | null
}

Regeln:
- "label": nur falls "hasConflict" true ist – genau ein Wort, das den Konflikt kurz benennt (z. B. "Bodenkonflikt", "Lichtkonkurrenz", "Nährstoffkonkurrenz"). Sonst null.
- "text": nur falls "hasConflict" true ist – 1-3 Sätze, die den Konflikt konkret erklären. Sonst null.
- Wenn du unsicher bist oder nichts Eindeutiges findest, setze "hasConflict" auf false.`;

async function analyzeConflict(input: {
  zoneName: string;
  light: string;
  orientation: string;
  soilType: string | null;
  plantNames: string[];
}): Promise<ConflictAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ist nicht konfiguriert.");
  }
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-5.6-terra",
    max_output_tokens: 2000,
    tools: [{ type: "web_search" }],
    input: [
      { type: "message", role: "system", content: SYSTEM_PROMPT },
      {
        type: "message",
        role: "user",
        content: `Zone "${input.zoneName}" mit Licht: ${input.light}, Ausrichtung: ${input.orientation}, Boden: ${input.soilType ?? "unbekannt"}.
Zugeordnete Pflanzen: ${input.plantNames.join(", ")}.
Prüfe auf Konflikte und gib danach ausschliesslich das JSON-Objekt zurück.`,
      },
    ],
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("Keine Textantwort von OpenAI erhalten.");
  }

  return extractJson(text) as ConflictAnalysis;
}

export async function checkZoneConflict(zoneId: number) {
  if (!isDbConfigured) return;
  const db = getDb();
  try {
    const [zone] = await db.select().from(zones).where(eq(zones.id, zoneId)).limit(1);
    if (!zone) return;

    const assignedPlants = await db
      .select({ germanName: plants.germanName, scientificName: plants.scientificName })
      .from(plantZoneAssignments)
      .innerJoin(plants, eq(plantZoneAssignments.plantId, plants.id))
      .where(eq(plantZoneAssignments.zoneId, zoneId));

    if (assignedPlants.length === 0) {
      await db
        .update(zones)
        .set({
          conflictStatus: "done",
          conflictLabel: null,
          conflictText: null,
          conflictCheckedAt: new Date(),
        })
        .where(eq(zones.id, zoneId));
      return;
    }

    const result = await analyzeConflict({
      zoneName: zone.name,
      light: zone.light,
      orientation: zone.orientation,
      soilType: zone.soilType,
      plantNames: assignedPlants.map((p) => p.germanName ?? p.scientificName),
    });

    await db
      .update(zones)
      .set({
        conflictStatus: "done",
        conflictLabel: result.hasConflict ? result.label : null,
        conflictText: result.hasConflict ? result.text : null,
        conflictCheckedAt: new Date(),
      })
      .where(eq(zones.id, zoneId));
  } catch {
    await getDb()
      .update(zones)
      .set({
        conflictStatus: "failed",
        conflictCheckedAt: new Date(),
      })
      .where(eq(zones.id, zoneId));
  }
}
