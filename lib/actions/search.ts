"use server";

import { or, ilike } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, zones } from "@/lib/db/schema";

export type SearchResult = {
  type: "plant" | "zone";
  id: number;
  name: string;
  subtitle: string | null;
};

export async function searchSiteContent(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0 || !isDbConfigured) return [];

  const db = getDb();
  const pattern = `%${trimmed}%`;

  const [matchedPlants, matchedZones] = await Promise.all([
    db
      .select({
        id: plants.id,
        germanName: plants.germanName,
        scientificName: plants.scientificName,
        commonName: plants.commonName,
      })
      .from(plants)
      .where(
        or(
          ilike(plants.germanName, pattern),
          ilike(plants.scientificName, pattern),
          ilike(plants.commonName, pattern),
        ),
      )
      .limit(15),
    db
      .select({ id: zones.id, name: zones.name })
      .from(zones)
      .where(ilike(zones.name, pattern))
      .limit(15),
  ]);

  const plantResults: SearchResult[] = matchedPlants.map((p) => ({
    type: "plant",
    id: p.id,
    name: p.germanName ?? p.scientificName,
    subtitle: p.germanName ? p.scientificName : p.commonName,
  }));

  const zoneResults: SearchResult[] = matchedZones.map((z) => ({
    type: "zone",
    id: z.id,
    name: z.name,
    subtitle: null,
  }));

  return [...plantResults, ...zoneResults];
}
