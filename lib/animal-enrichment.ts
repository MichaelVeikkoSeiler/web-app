import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { extractJson } from "@/lib/enrichment";

type EnrichmentResult = {
  germanName: string | null;
  commonName: string | null;
  factsText: string;
};

const SYSTEM_PROMPT = `Du bist ein Zoologe, der Informationen für ein privates Garten-Journal recherchiert.
Der Garten liegt in Müntschemier, Kanton Bern, Schweiz (gemässigtes mitteleuropäisches Klima, ca. 480 m ü. M.).
Nutze die Websuche, um verlässliche Angaben zu finden.
Antworte ausschliesslich auf Deutsch und antworte am Ende AUSSCHLIESSLICH mit einem einzigen JSON-Objekt (keine Markdown-Codeblöcke, kein Fliesstext davor oder danach) exakt in diesem Format:

{
  "germanName": string | null,
  "commonName": string | null,
  "factsText": string
}

Regeln:
- "factsText": 2-5 kurze, interessante Sätze über das Tier (Lebensraum, Verhalten, Besonderheiten, ob es für den Garten nützlich oder ein Schädling ist).
- Wenn eine Angabe nicht ermittelbar ist, setze das Feld auf null.`;

async function researchAnimal(scientificName: string): Promise<EnrichmentResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ist nicht konfiguriert.");
  }
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-5.6-terra",
    max_output_tokens: 1000,
    tools: [{ type: "web_search" }],
    input: [
      { type: "message", role: "system", content: SYSTEM_PROMPT },
      {
        type: "message",
        role: "user",
        content: `Recherchiere Informationen für: ${scientificName}. Gib danach ausschliesslich das JSON-Objekt zurück.`,
      },
    ],
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("Keine Textantwort von OpenAI erhalten.");
  }

  return extractJson(text) as EnrichmentResult;
}

export async function enrichAnimal(animalId: number) {
  if (!isDbConfigured) return;
  const db = getDb();
  try {
    const [animal] = await db.select().from(animals).where(eq(animals.id, animalId)).limit(1);
    if (!animal) return;

    const result = await researchAnimal(animal.scientificName);

    await db
      .update(animals)
      .set({
        germanName: result.germanName ?? animal.germanName,
        commonName: result.commonName ?? animal.commonName,
        factsText: result.factsText ?? null,
        enrichmentStatus: "done",
        enrichmentError: null,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, animalId));
  } catch (e) {
    await getDb()
      .update(animals)
      .set({
        enrichmentStatus: "failed",
        enrichmentError: e instanceof Error ? e.message : "Unbekannter Fehler",
        updatedAt: new Date(),
      })
      .where(eq(animals.id, animalId));
  }
}
