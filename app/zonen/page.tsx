import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantZoneAssignments, zonePhotos } from "@/lib/db/schema";
import {
  getZonesHeroImageUrl,
  setZonesHeroImage,
  clearZonesHeroImage,
} from "@/lib/actions/settings";
import { ZoneList } from "@/components/zones/zone-list";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function ZonenPage() {
  const [zoneRows, assignments, heroImageUrl, primaryZonePhotos] = isDbConfigured
    ? await Promise.all([
        getDb().select().from(zones).orderBy(zones.orderIndex),
        getDb()
          .select({ zoneId: plantZoneAssignments.zoneId })
          .from(plantZoneAssignments),
        getZonesHeroImageUrl(),
        getDb()
          .select({ zoneId: zonePhotos.zoneId, blobUrl: zonePhotos.blobUrl })
          .from(zonePhotos)
          .where(eq(zonePhotos.isPrimary, true)),
      ])
    : [[], [], null, []];

  const countByZone = new Map<number, number>();
  for (const a of assignments) {
    countByZone.set(a.zoneId, (countByZone.get(a.zoneId) ?? 0) + 1);
  }

  const photoByZone = new Map(primaryZonePhotos.map((p) => [p.zoneId, p.blobUrl]));

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Zonen"
        uploadLabel="Bild hochladen"
        onUpload={setZonesHeroImage}
        onDelete={clearZonesHeroImage}
      />
      <ZoneList
        zones={zoneRows.map((z) => ({
          id: z.id,
          name: z.name,
          imageUrl: photoByZone.get(z.id) ?? null,
          plantCount: countByZone.get(z.id) ?? 0,
        }))}
      />
    </div>
  );
}
