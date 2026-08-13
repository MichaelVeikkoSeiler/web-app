export type PlantNetCandidate = {
  score: number;
  scientificName: string;
  commonNames: string[];
  family: string;
  /** "ai" markiert Vorschläge aus dem KI-Bilderkennungs-Fallback statt aus PlantNet. */
  source?: "ai";
};

const IDENTIFY_TIMEOUT_MS = 10_000;

export async function identifyPlantPhoto(
  file: File,
): Promise<PlantNetCandidate[]> {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    throw new Error("PLANTNET_API_KEY ist nicht konfiguriert.");
  }
  const project = process.env.PLANTNET_PROJECT || "k-middle-europe";

  const form = new FormData();
  form.append("images", file);
  form.append("organs", "auto");

  const url = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(IDENTIFY_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new Error(
        "Erkennung hat zu lange gedauert. Bitte Art manuell eingeben.",
      );
    }
    throw e;
  }

  if (!res.ok) {
    if (res.status === 404) {
      return [];
    }
    const text = await res.text().catch(() => "");
    throw new Error(
      `PlantNet-Anfrage fehlgeschlagen (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return results.slice(0, 5).map((r: any) => ({
    score: r.score,
    scientificName: r.species?.scientificNameWithoutAuthor ?? "Unbekannt",
    commonNames: r.species?.commonNames ?? [],
    family: r.species?.family?.scientificNameWithoutAuthor ?? "",
  }));
}
