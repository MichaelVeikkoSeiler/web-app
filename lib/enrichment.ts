import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants } from "@/lib/db/schema";

type Period = { text: string | null; startMonth: number | null; endMonth: number | null };

type EnrichmentResult = {
  germanName: string | null;
  commonName: string | null;
  factsText: string;
  isFruitOrBerry: boolean;
  bloom: Period;
  harvest: Period;
  pruning: Period;
  fertilizing: Period;
  watering: { rhythmDays: number; notes: string };
};

const SYSTEM_PROMPT = `Du bist ein Gartenexperte, der Pflegeinformationen für ein privates Garten-Journal recherchiert.
Der Garten liegt in Müntschemier, Kanton Bern, Schweiz (gemässigtes mitteleuropäisches Klima, ca. 480 m ü. M.).
Nutze die Websuche, um verlässliche, für dieses Klima passende Angaben zu finden.
Antworte ausschliesslich auf Deutsch und antworte am Ende AUSSCHLIESSLICH mit einem einzigen JSON-Objekt (keine Markdown-Codeblöcke, kein Fliesstext davor oder danach) exakt in diesem Format:

{
  "germanName": string | null,
  "commonName": string | null,
  "factsText": string,
  "isFruitOrBerry": boolean,
  "bloom": { "text": string | null, "startMonth": number | null, "endMonth": number | null },
  "harvest": { "text": string | null, "startMonth": number | null, "endMonth": number | null },
  "pruning": { "text": string | null, "startMonth": number | null, "endMonth": number | null },
  "fertilizing": { "text": string | null, "startMonth": number | null, "endMonth": number | null },
  "watering": { "rhythmDays": number, "notes": string }
}

Regeln:
- "factsText": 2-4 kurze, interessante Sätze über die Pflanze (Herkunft, Besonderheiten).
- "isFruitOrBerry": true nur bei Frucht- oder Beerenpflanzen. Wenn false, setze "harvest" auf { "text": null, "startMonth": null, "endMonth": null }.
- Monate als Zahlen 1-12. Wenn ein Zeitraum den Jahreswechsel überschreitet (z.B. November bis Februar), ist startMonth > endMonth erlaubt.
- "watering.rhythmDays": typischer Giessrhythmus in Tagen unter normalen Bedingungen (Richtwert als Zahl, z.B. 3 für alle 3 Tage, 7 für wöchentlich).
- Wenn eine Angabe nicht ermittelbar ist, setze das Feld auf null (bzw. bei rhythmDays einen plausiblen Schätzwert).`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Keine JSON-Antwort gefunden.");
  return JSON.parse(text.slice(start, end + 1));
}

async function researchPlantCare(scientificName: string): Promise<EnrichmentResult> {
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
        content: `Recherchiere Pflegeinformationen für: ${scientificName}. Gib danach ausschliesslich das JSON-Objekt zurück.`,
      },
    ],
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("Keine Textantwort von OpenAI erhalten.");
  }

  const parsed = extractJson(text) as EnrichmentResult;
  return parsed;
}

export async function enrichPlant(plantId: number) {
  if (!isDbConfigured) return;
  const db = getDb();
  try {
    const [plant] = await db.select().from(plants).where(eq(plants.id, plantId)).limit(1);
    if (!plant) return;

    const result = await researchPlantCare(plant.scientificName);

    await db
      .update(plants)
      .set({
        germanName: result.germanName ?? plant.germanName,
        commonName: result.commonName ?? plant.commonName,
        factsText: result.factsText ?? null,
        isFruitOrBerry: Boolean(result.isFruitOrBerry),
        bloomPeriodText: result.bloom?.text ?? null,
        bloomStartMonth: result.bloom?.startMonth ?? null,
        bloomEndMonth: result.bloom?.endMonth ?? null,
        harvestPeriodText: result.harvest?.text ?? null,
        harvestStartMonth: result.harvest?.startMonth ?? null,
        harvestEndMonth: result.harvest?.endMonth ?? null,
        pruningPeriodText: result.pruning?.text ?? null,
        pruningStartMonth: result.pruning?.startMonth ?? null,
        pruningEndMonth: result.pruning?.endMonth ?? null,
        fertilizingPeriodText: result.fertilizing?.text ?? null,
        fertilizingStartMonth: result.fertilizing?.startMonth ?? null,
        fertilizingEndMonth: result.fertilizing?.endMonth ?? null,
        wateringRhythmDays: result.watering?.rhythmDays ?? null,
        wateringNotes: result.watering?.notes ?? null,
        enrichmentStatus: "done",
        enrichmentError: null,
        updatedAt: new Date(),
      })
      .where(eq(plants.id, plantId));
  } catch (e) {
    await getDb()
      .update(plants)
      .set({
        enrichmentStatus: "failed",
        enrichmentError: e instanceof Error ? e.message : "Unbekannter Fehler",
        updatedAt: new Date(),
      })
      .where(eq(plants.id, plantId));
  }
}
