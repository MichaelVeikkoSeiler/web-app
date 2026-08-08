import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantZoneAssignments } from "@/lib/db/schema";
import { ZoneList } from "@/components/zones/zone-list";

export default async function ZonenPage() {
  const [zoneRows, assignments] = isDbConfigured
    ? await Promise.all([
        getDb().select().from(zones).orderBy(zones.orderIndex),
        getDb()
          .select({ zoneId: plantZoneAssignments.zoneId })
          .from(plantZoneAssignments),
      ])
    : [[], []];

  const countByZone = new Map<number, number>();
  for (const a of assignments) {
    countByZone.set(a.zoneId, (countByZone.get(a.zoneId) ?? 0) + 1);
  }

  return (
    <ZoneList
      zones={zoneRows.map((z) => ({
        id: z.id,
        name: z.name,
        imageUrl: z.imageUrl,
        plantCount: countByZone.get(z.id) ?? 0,
      }))}
    />
  );
}
