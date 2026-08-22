import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos, plantZoneAssignments, zones, zonePhotos } from "@/lib/db/schema";
import { computeHelpFlags } from "@/lib/help-logic";
import { getWeatherSnapshot } from "@/lib/openmeteo";
import { monthRangeDuration, isMonthInRange, monthName } from "@/lib/date-utils";

export type PlantListItem = {
  id: number;
  name: string;
  photoUrl: string | null;
};

export type ZoneGroup = {
  zoneId: number | null;
  zoneName: string;
  zoneImageUrl: string | null;
  plants: PlantListItem[];
};

export type PlantsOverviewData = {
  totalCount: number;
  groups: ZoneGroup[];
};

export async function getPlantsGroupedByZone(): Promise<PlantsOverviewData> {
  if (!isDbConfigured) return { totalCount: 0, groups: [] };

  const db = getDb();
  const [allPlants, allZones, assignments, photos, zonePhotoRows] = await Promise.all([
    db.select().from(plants),
    db
      .select({ id: zones.id, name: zones.name })
      .from(zones)
      .orderBy(zones.orderIndex),
    db
      .select({ plantId: plantZoneAssignments.plantId, zoneId: plantZoneAssignments.zoneId })
      .from(plantZoneAssignments),
    db.select().from(plantPhotos).where(eq(plantPhotos.isPrimary, true)),
    db
      .select({ zoneId: zonePhotos.zoneId, blobUrl: zonePhotos.blobUrl })
      .from(zonePhotos)
      .where(eq(zonePhotos.isPrimary, true)),
  ]);

  const photoByPlant = new Map<number, string>();
  for (const p of photos) {
    if (!photoByPlant.has(p.plantId)) photoByPlant.set(p.plantId, p.blobUrl);
  }

  const photoByZone = new Map(zonePhotoRows.map((p) => [p.zoneId, p.blobUrl]));

  const zoneIdsByPlant = new Map<number, number[]>();
  for (const a of assignments) {
    const list = zoneIdsByPlant.get(a.plantId) ?? [];
    list.push(a.zoneId);
    zoneIdsByPlant.set(a.plantId, list);
  }

  function toListItem(plant: (typeof allPlants)[number]): PlantListItem {
    return {
      id: plant.id,
      name: plant.germanName ?? plant.scientificName,
      photoUrl: photoByPlant.get(plant.id) ?? null,
    };
  }

  const groups: ZoneGroup[] = allZones.map((z) => ({
    zoneId: z.id,
    zoneName: z.name,
    zoneImageUrl: photoByZone.get(z.id) ?? null,
    plants: [],
  }));
  const groupByZoneId = new Map(groups.map((g) => [g.zoneId, g]));
  const unassigned: PlantListItem[] = [];

  for (const plant of allPlants) {
    const zoneIds = zoneIdsByPlant.get(plant.id) ?? [];
    if (zoneIds.length === 0) {
      unassigned.push(toListItem(plant));
      continue;
    }
    for (const zoneId of zoneIds) {
      groupByZoneId.get(zoneId)?.plants.push(toListItem(plant));
    }
  }

  for (const group of groups) {
    group.plants.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  unassigned.sort((a, b) => a.name.localeCompare(b.name, "de"));

  const nonEmptyGroups = groups.filter((g) => g.plants.length > 0);
  if (unassigned.length > 0) {
    nonEmptyGroups.push({
      zoneId: null,
      zoneName: "Ohne Zone",
      zoneImageUrl: null,
      plants: unassigned,
    });
  }

  return { totalCount: allPlants.length, groups: nonEmptyGroups };
}

export type TodoItem = {
  plantId: number;
  plantName: string;
  type: "water" | "prune" | "fertilize";
  label: string;
};

export async function getTodoItems(): Promise<TodoItem[]> {
  if (!isDbConfigured) return [];

  const db = getDb();
  const [allPlants, weather] = await Promise.all([
    db.select().from(plants),
    getWeatherSnapshot().catch(() => null),
  ]);
  const precipitation = weather?.precipitationLast7Days ?? Infinity;
  const now = new Date();

  const items: TodoItem[] = [];
  for (const plant of allPlants) {
    const help = computeHelpFlags(plant, precipitation, now);
    const plantName = plant.germanName ?? plant.scientificName;
    if (help.needsWater) {
      items.push({ plantId: plant.id, plantName, type: "water", label: "Giessen" });
    }
    if (help.needsPruning) {
      items.push({ plantId: plant.id, plantName, type: "prune", label: "Rückschnitt" });
    }
    if (help.needsFertilizing) {
      items.push({ plantId: plant.id, plantName, type: "fertilize", label: "Düngen" });
    }
  }
  return items;
}

export type RankedHighlight = { plantId: number; plantName: string; display: string };

export type PlantHighlights = {
  nowBlooming: RankedHighlight[];
  mostWater: RankedHighlight[];
  leastWater: RankedHighlight[];
  longestBloom: RankedHighlight[];
  shortestBloom: RankedHighlight[];
  mostDemanding: RankedHighlight[];
  leastDemanding: RankedHighlight[];
};

const TOP_N = 10;

export async function getPlantHighlights(): Promise<PlantHighlights> {
  const empty: PlantHighlights = {
    nowBlooming: [],
    mostWater: [],
    leastWater: [],
    longestBloom: [],
    shortestBloom: [],
    mostDemanding: [],
    leastDemanding: [],
  };
  if (!isDbConfigured) return empty;

  const allPlants = await getDb().select().from(plants);

  function name(plant: (typeof allPlants)[number]): string {
    return plant.germanName ?? plant.scientificName;
  }

  function ranked<T>(
    items: (typeof allPlants)[number][],
    getValue: (p: (typeof allPlants)[number]) => T | null,
    compare: (a: T, b: T) => number,
    display: (v: T) => string,
  ): RankedHighlight[] {
    return items
      .map((p) => ({ plant: p, value: getValue(p) }))
      .filter((x): x is { plant: (typeof allPlants)[number]; value: T } => x.value !== null)
      .sort((a, b) => compare(a.value, b.value) || name(a.plant).localeCompare(name(b.plant), "de"))
      .slice(0, TOP_N)
      .map((x) => ({ plantId: x.plant.id, plantName: name(x.plant), display: display(x.value) }));
  }

  const byRhythm = (p: (typeof allPlants)[number]) => p.wateringRhythmDays;
  const rhythmDisplay = (v: number) => `alle ${v} Tage`;

  const mostWater = ranked(allPlants, byRhythm, (a, b) => a - b, rhythmDisplay);
  const leastWater = ranked(allPlants, byRhythm, (a, b) => b - a, rhythmDisplay);

  const byBloomDuration = (p: (typeof allPlants)[number]) =>
    p.bloomStartMonth && p.bloomEndMonth
      ? monthRangeDuration(p.bloomStartMonth, p.bloomEndMonth)
      : null;
  const bloomDisplay = (v: number) => (v === 1 ? "1 Monat" : `${v} Monate`);

  const longestBloom = ranked(allPlants, byBloomDuration, (a, b) => b - a, bloomDisplay);
  const shortestBloom = ranked(allPlants, byBloomDuration, (a, b) => a - b, bloomDisplay);

  const byDifficulty = (p: (typeof allPlants)[number]) => p.careDifficulty;
  const difficultyDisplay = (v: number) => `${v}/10`;

  const mostDemanding = ranked(allPlants, byDifficulty, (a, b) => b - a, difficultyDisplay);
  const leastDemanding = ranked(allPlants, byDifficulty, (a, b) => a - b, difficultyDisplay);

  const currentMonth = new Date().getMonth() + 1;
  const nowBlooming: RankedHighlight[] = allPlants
    .filter((p) => isMonthInRange(currentMonth, p.bloomStartMonth, p.bloomEndMonth))
    .sort((a, b) => name(a).localeCompare(name(b), "de"))
    .map((p) => ({
      plantId: p.id,
      plantName: name(p),
      display:
        p.bloomStartMonth && p.bloomEndMonth
          ? `${monthName(p.bloomStartMonth)}–${monthName(p.bloomEndMonth)}`
          : "",
    }));

  return {
    nowBlooming,
    mostWater,
    leastWater,
    longestBloom,
    shortestBloom,
    mostDemanding,
    leastDemanding,
  };
}
