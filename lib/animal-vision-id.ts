import OpenAI from "openai";
import { extractJson } from "@/lib/enrichment";

export type AnimalCandidate = {
  scientificName: string;
  commonNames: string[];
};

const SYSTEM_PROMPT = `Du bist ein Zoologe und hilfst, Gartentiere anhand eines Fotos zu bestimmen. Der Garten liegt in Müntschemier, Kanton Bern, Schweiz (gemässigtes mitteleuropäisches Klima). Es kann sich um Vögel, Insekten, Säugetiere, Amphibien, Reptilien oder andere Gartenbewohner handeln.

Nenne 1 bis 3 plausible Kandidaten für die zoologische Art, wahrscheinlichste zuerst. Wenn du auf dem Foto kein Tier mit ausreichender Sicherheit erkennen kannst, gib ein leeres candidates-Array zurück – erfinde niemals eine Art, die nicht zum Foto passt.

Antworte ausschliesslich mit einem JSON-Objekt in diesem Format, ohne weiteren Text:
{
  "candidates": [
    { "scientificName": string, "commonName": string | null }
  ]
}`;

export async function identifyAnimalPhotoWithVision(file: File): Promise<AnimalCandidate[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-5.6-terra",
    max_output_tokens: 500,
    input: [
      { type: "message", role: "system", content: SYSTEM_PROMPT },
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: "Welche Tierart zeigt dieses Foto?" },
          { type: "input_image", image_url: dataUrl, detail: "auto" as const },
        ],
      },
    ],
  });

  const text = response.output_text;
  if (!text) return [];

  const parsed = extractJson(text) as {
    candidates?: { scientificName?: string; commonName?: string | null }[];
  };
  if (!Array.isArray(parsed.candidates)) return [];

  return parsed.candidates
    .filter((c): c is { scientificName: string; commonName?: string | null } =>
      Boolean(c.scientificName),
    )
    .slice(0, 3)
    .map((c) => ({
      scientificName: c.scientificName,
      commonNames: c.commonName ? [c.commonName] : [],
    }));
}
