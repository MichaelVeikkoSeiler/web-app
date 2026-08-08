import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantZoneAssignments, plants } from "@/lib/db/schema";
import { ZoneList } from "@/components/zones/zone-list";

export default async function ZonenPage() {
  const [zoneRows, assignments, allPlants] = isDbConfigured
    ? await Promise.all([
        getDb().select().from(zones).orderBy(zones.orderIndex),
        getDb()
          .select({
            zoneId: plantZoneAssignments.zoneId,
            plantId: plants.id,
            germanName: plants.germanName,
            scientificName: plants.scientificName,
          })
          .from(plantZoneAssignments)
          .innerJoin(plants, eq(plantZoneAssignments.plantId, plants.id)),
        getDb()
          .select({
            id: plants.id,
            germanName: plants.germanName,
            scientificName: plants.scientificName,
          })
          .from(plants),
      ])
    : [[], [], []];

  const plantsByZone = new Map<number, { id: number; name: string }[]>();
  for (const a of assignments) {
    const list = plantsByZone.get(a.zoneId) ?? [];
    list.push({ id: a.plantId, name: a.germanName ?? a.scientificName });
    plantsByZone.set(a.zoneId, list);
  }

  return (
    <ZoneList
      zones={zoneRows.map((z) => ({
        ...z,
        soilType: z.soilType ?? "",
        notes: z.notes ?? "",
        plants: plantsByZone.get(z.id) ?? [],
      }))}
      allPlants={allPlants.map((p) => ({
        id: p.id,
        name: p.germanName ?? p.scientificName,
      }))}
    />
  );
}
