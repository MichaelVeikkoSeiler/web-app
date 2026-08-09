import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantZoneAssignments } from "@/lib/db/schema";
import { getZonesHeroImageUrl, setZonesHeroImage } from "@/lib/actions/settings";
import { ZoneList } from "@/components/zones/zone-list";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function ZonenPage() {
  const [zoneRows, assignments, heroImageUrl] = isDbConfigured
    ? await Promise.all([
        getDb().select().from(zones).orderBy(zones.orderIndex),
        getDb()
          .select({ zoneId: plantZoneAssignments.zoneId })
          .from(plantZoneAssignments),
        getZonesHeroImageUrl(),
      ])
    : [[], [], null];

  const countByZone = new Map<number, number>();
  for (const a of assignments) {
    countByZone.set(a.zoneId, (countByZone.get(a.zoneId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Zonen"
        uploadLabel="Bild hochladen"
        onUpload={setZonesHeroImage}
      />
      <ZoneList
        zones={zoneRows.map((z) => ({
          id: z.id,
          name: z.name,
          imageUrl: z.imageUrl,
          plantCount: countByZone.get(z.id) ?? 0,
        }))}
      />
    </div>
  );
}
