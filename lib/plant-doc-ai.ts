import OpenAI from "openai";
import { eq, asc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plantDocCases, plantDocPhotos } from "@/lib/db/schema";
import { extractJson } from "@/lib/enrichment";
import type { PlantDocAiResult, PlantDocAnswers, PlantDocContext } from "@/lib/plant-doc-types";

const CAUSE_CATEGORIES = [
  "Wassermangel",
  "Staunässe/Überwässerung",
  "Sonnenbrand",
  "Frostschaden",
  "Hitzestress",
  "Nährstoffmangel",
  "Nährstoffüberschuss",
  "Pilzerkrankung",
  "bakterielle Erkrankung",
  "Schädlinge",
  "mechanische Schäden",
  "natürlicher Alterungsprozess",
  "Standortproblem",
  "unbekannt / nicht sicher bestimmbar",
];

const CONFIDENCE_LEVELS = ["sehr wahrscheinlich", "wahrscheinlich", "möglich", "eher unwahrscheinlich"];

const SYSTEM_PROMPT = `Du bist ein erfahrener Pflanzenexperte ("Plant Doc"), der anhand von Fotos und Kontextdaten mögliche Probleme an Gartenpflanzen einschätzt.
Der Garten liegt in Müntschemier, Kanton Bern, Schweiz (gemässigtes mitteleuropäisches Klima, ca. 480 m ü. M.).

Wichtig: Du täuschst NIE eine definitive Diagnose vor. Du nennst Wahrscheinlichkeiten, mögliche Ursachen und konkrete nächste Schritte.

Mögliche Ursachen-Kategorien (verwende für "primaryCauseCategory" und Einträge in "otherCauses" nach Möglichkeit exakt einen dieser Begriffe):
${CAUSE_CATEGORIES.map((c) => `- ${c}`).join("\n")}

Konfidenz-Stufen für "confidence" (exakt einer dieser vier Begriffe, keine Prozentwerte):
${CONFIDENCE_LEVELS.map((c) => `- ${c}`).join("\n")}

Sicherheitslogik: Wenn die Bilder und Angaben keine verlässliche Einschätzung erlauben, setze "confidence" auf "möglich" oder "eher unwahrscheinlich", "needsMoreInfo" auf true, und schlage in "missingInfoSuggestions" konkret vor, was zusätzlich fotografiert oder geprüft werden sollte (z.B. "Blattunterseite fotografieren", "Gesamtpflanze fotografieren", "Stamm näher fotografieren", "Bodenfeuchtigkeit prüfen"). Erfinde niemals Sicherheit, die die Bilder nicht hergeben.

Websuche: Du hast ein Websuche-Werkzeug zur Verfügung. Nutze es NUR, wenn "primaryCauseCategory" eine Pilzerkrankung, bakterielle Erkrankung oder Schädlinge ist, um aktuelle, seriöse Zusatzinformationen zu ergänzen. Bei allen anderen Kategorien (z.B. Wassermangel, Sonnenbrand, Standortproblem) nutze die Websuche NICHT.

Antworte ausschliesslich auf Deutsch und am Ende AUSSCHLIESSLICH mit einem einzigen JSON-Objekt (keine Markdown-Codeblöcke, kein Fliesstext davor oder danach) exakt in diesem Format:

{
  "primaryCause": string,
  "primaryCauseCategory": string,
  "confidence": string,
  "reasoning": string,
  "otherCauses": string[],
  "recommendations": string[],
  "recheckAfterDays": number | null,
  "needsMoreInfo": boolean,
  "missingInfoSuggestions": string[],
  "usedWebSearch": boolean
}

Regeln:
- "primaryCause": kurze, konkrete Bezeichnung der wahrscheinlichsten Ursache (z.B. "Trockenstress"), nicht nur die Kategorie.
- "reasoning": 2-4 Sätze, die konkret auf das Bild UND den Kontext (Wetter, Pflege, Standort) Bezug nehmen.
- "recommendations": 2-5 konkrete, umsetzbare nächste Schritte als kurze Sätze, keine Nummerierung im Text selbst.
- "recheckAfterDays": plausible Anzahl Tage bis zur erneuten Kontrolle, oder null wenn nicht sinnvoll einschätzbar.
- "usedWebSearch": true nur, wenn du die Websuche tatsächlich genutzt hast.`;

function formatContext(context: PlantDocContext, answers: PlantDocAnswers): string {
  const lines: string[] = [];
  const p = context.plant;

  lines.push(`Pflanze: ${p.germanName ?? p.scientificName} (${p.scientificName})`);
  if (p.commonName) lines.push(`Weiterer Name: ${p.commonName}`);

  for (const z of context.zones) {
    lines.push(
      `Zone "${z.name}": Licht ${z.light}, Ausrichtung ${z.orientation}` +
        (z.soilType ? `, Boden ${z.soilType}` : "") +
        (z.notes ? `, Notiz: ${z.notes}` : ""),
    );
  }

  if (p.wateringRhythmDays) {
    lines.push(
      `Üblicher Giessrhythmus: alle ${p.wateringRhythmDays} Tage` +
        (p.wateringNotes ? ` (${p.wateringNotes})` : ""),
    );
  }
  if (p.lastWateredAt) lines.push(`Zuletzt gegossen: ${p.lastWateredAt.slice(0, 10)}`);
  if (p.pruningPeriodText) lines.push(`Rückschnitt-Zeitraum: ${p.pruningPeriodText}`);
  if (p.lastPrunedAt) lines.push(`Zuletzt zurückgeschnitten: ${p.lastPrunedAt.slice(0, 10)}`);
  if (p.fertilizingPeriodText) lines.push(`Düngezeitraum: ${p.fertilizingPeriodText}`);
  if (p.lastFertilizedAt) lines.push(`Zuletzt gedüngt: ${p.lastFertilizedAt.slice(0, 10)}`);
  if (p.bloomPeriodText) lines.push(`Blütezeit: ${p.bloomPeriodText}`);

  if (context.weather) {
    lines.push(`Niederschlag letzte 7 Tage: ${context.weather.precipitationLast7Days.toFixed(0)} mm`);
    const days = context.weather.last14Days;
    if (days.length > 0) {
      const maxTemp = Math.max(...days.map((d) => d.tempMax));
      const minTemp = Math.min(...days.map((d) => d.tempMin));
      const totalRain = days.reduce((s, d) => s + (d.precipitationSum ?? 0), 0);
      lines.push(
        `Wetter letzte ${days.length} Tage: Höchsttemperatur ${maxTemp.toFixed(0)}°C, Tiefsttemperatur ${minTemp.toFixed(0)}°C, Niederschlag gesamt ${totalRain.toFixed(0)} mm`,
      );
      const frostDays = days.filter((d) => d.tempMin <= 0).length;
      if (frostDays > 0) lines.push(`Frost an ${frostDays} der letzten ${days.length} Tage.`);
      const hotDays = days.filter((d) => d.tempMax >= 30).length;
      if (hotDays > 0) lines.push(`Hitze (≥30°C) an ${hotDays} der letzten ${days.length} Tage.`);
    }
  }

  if (context.previousCases.length > 0) {
    lines.push("Frühere Plant-Doc-Fälle dieser Pflanze:");
    for (const c of context.previousCases) {
      lines.push(`- ${c.date.slice(0, 10)}: ${c.primaryCause ?? "keine Ursache bestimmt"} (Status: ${c.status})`);
    }
  }

  lines.push("");
  lines.push(`Betroffener Bereich: ${answers.location.join(", ") || "nicht angegeben"}`);
  lines.push(`Auffälligkeiten: ${answers.observations.join(", ") || "nicht angegeben"}`);
  lines.push(`Seit wann: ${answers.sinceWhen}`);
  if (answers.freeText) lines.push(`Zusätzliche Angaben: ${answers.freeText}`);

  return lines.join("\n");
}

async function requestPlantDocAnalysis(
  contextText: string,
  photoUrls: string[],
): Promise<PlantDocAiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ist nicht konfiguriert.");
  }
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-5.6-terra",
    max_output_tokens: 2500,
    tools: [{ type: "web_search" }],
    input: [
      { type: "message", role: "system", content: SYSTEM_PROMPT },
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: `${contextText}\n\nGib danach ausschliesslich das JSON-Objekt zurück.` },
          ...photoUrls.map((url) => ({
            type: "input_image" as const,
            image_url: url,
            detail: "auto" as const,
          })),
        ],
      },
    ],
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("Keine Textantwort von OpenAI erhalten.");
  }

  const parsed = extractJson(text) as Partial<PlantDocAiResult>;

  return {
    primaryCause: parsed.primaryCause ?? null,
    primaryCauseCategory: parsed.primaryCauseCategory ?? null,
    confidence: parsed.confidence ?? null,
    reasoning: parsed.reasoning ?? null,
    otherCauses: Array.isArray(parsed.otherCauses) ? parsed.otherCauses : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    recheckAfterDays: typeof parsed.recheckAfterDays === "number" ? parsed.recheckAfterDays : null,
    needsMoreInfo: Boolean(parsed.needsMoreInfo),
    missingInfoSuggestions: Array.isArray(parsed.missingInfoSuggestions)
      ? parsed.missingInfoSuggestions
      : [],
    usedWebSearch: Boolean(parsed.usedWebSearch),
  };
}

export async function analyzePlantDocCase(caseId: number) {
  if (!isDbConfigured) return;
  const db = getDb();

  try {
    const [docCase] = await db
      .select()
      .from(plantDocCases)
      .where(eq(plantDocCases.id, caseId))
      .limit(1);
    if (!docCase) return;
    if (!docCase.contextSnapshot) {
      throw new Error("Kein Kontext-Snapshot vorhanden.");
    }

    const photos = await db
      .select({ blobUrl: plantDocPhotos.blobUrl })
      .from(plantDocPhotos)
      .where(eq(plantDocPhotos.caseId, caseId))
      .orderBy(asc(plantDocPhotos.id));

    const contextText = formatContext(
      docCase.contextSnapshot as PlantDocContext,
      docCase.answers as PlantDocAnswers,
    );
    const result = await requestPlantDocAnalysis(
      contextText,
      photos.map((p) => p.blobUrl),
    );

    await db
      .update(plantDocCases)
      .set({
        analysisStatus: "done",
        analysisError: null,
        primaryCause: result.primaryCause,
        primaryCauseCategory: result.primaryCauseCategory,
        confidence: result.confidence,
        reasoning: result.reasoning,
        otherCauses: result.otherCauses,
        recommendations: result.recommendations,
        recheckAfterDays: result.recheckAfterDays,
        needsMoreInfo: result.needsMoreInfo,
        missingInfoSuggestions: result.missingInfoSuggestions,
        usedWebSearch: result.usedWebSearch,
        updatedAt: new Date(),
      })
      .where(eq(plantDocCases.id, caseId));
  } catch (e) {
    await getDb()
      .update(plantDocCases)
      .set({
        analysisStatus: "failed",
        analysisError: e instanceof Error ? e.message : "Unbekannter Fehler",
        updatedAt: new Date(),
      })
      .where(eq(plantDocCases.id, caseId));
  }
}
