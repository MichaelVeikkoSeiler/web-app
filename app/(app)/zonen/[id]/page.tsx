import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Sun, CloudSun, CloudMoon } from "lucide-react";
import { getDb, isDbConfigured } from "@/lib/db";
import {
  zones,
  plantZoneAssignments,
  plants,
  plantPhotos,
  animalZoneAssignments,
  animals,
  animalPhotos,
  zoneSoilChecks,
  zonePhotos,
  zoneNotes,
} from "@/lib/db/schema";
import { ZoneHero } from "@/components/zones/zone-hero";
import { ZonePlants } from "@/components/zones/zone-plants";
import { ZoneAnimals } from "@/components/zones/zone-animals";
import { ZoneDetailActions } from "@/components/zones/zone-detail-actions";
import { SoilSection } from "@/components/zones/soil-section";
import { OtherZonesOverview } from "@/components/zones/other-zones-overview";
import { NoteList } from "@/components/ui/note-list";
import { addZoneNote, deleteZoneNote } from "@/lib/actions/zones";

const lightIcon = {
  sonnig: Sun,
  halbschattig: CloudSun,
  schattig: CloudMoon,
};

const orientationLabel = { N: "Norden", O: "Osten", S: "Süden", W: "Westen" };

export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zoneId = Number(id);
  if (Number.isNaN(zoneId)) notFound();
  if (!isDbConfigured) notFound();

  const db = getDb();
  const [zone] = await db.select().from(zones).where(eq(zones.id, zoneId)).limit(1);
  if (!zone) notFound();

  const [
    assignments,
    allPlantRows,
    primaryPhotos,
    animalAssignments,
    allAnimalRows,
    primaryAnimalPhotos,
    latestSoilCheckRows,
    zonePhotoRows,
    allZoneRows,
    primaryZonePhotos,
    notes,
  ] = await Promise.all([
    db
      .select({
        plantId: plants.id,
        germanName: plants.germanName,
        scientificName: plants.scientificName,
      })
      .from(plantZoneAssignments)
      .innerJoin(plants, eq(plantZoneAssignments.plantId, plants.id))
      .where(eq(plantZoneAssignments.zoneId, zoneId)),
    db
      .select({
        id: plants.id,
        germanName: plants.germanName,
        scientificName: plants.scientificName,
      })
      .from(plants),
    db
      .select({ plantId: plantPhotos.plantId, blobUrl: plantPhotos.blobUrl })
      .from(plantPhotos)
      .where(eq(plantPhotos.isPrimary, true)),
    db
      .select({
        animalId: animals.id,
        germanName: animals.germanName,
        commonName: animals.commonName,
        scientificName: animals.scientificName,
      })
      .from(animalZoneAssignments)
      .innerJoin(animals, eq(animalZoneAssignments.animalId, animals.id))
      .where(eq(animalZoneAssignments.zoneId, zoneId)),
    db
      .select({
        id: animals.id,
        germanName: animals.germanName,
        commonName: animals.commonName,
        scientificName: animals.scientificName,
      })
      .from(animals),
    db
      .select({ animalId: animalPhotos.animalId, blobUrl: animalPhotos.blobUrl })
      .from(animalPhotos)
      .where(eq(animalPhotos.isPrimary, true)),
    db
      .select({
        soilTexture: zoneSoilChecks.soilTexture,
        phValue: zoneSoilChecks.phValue,
        drainageClass: zoneSoilChecks.drainageClass,
      })
      .from(zoneSoilChecks)
      .where(eq(zoneSoilChecks.zoneId, zoneId))
      .orderBy(desc(zoneSoilChecks.createdAt))
      .limit(1),
    db.select().from(zonePhotos).where(eq(zonePhotos.zoneId, zoneId)),
    db.select({ id: zones.id, name: zones.name }).from(zones).orderBy(zones.orderIndex),
    db
      .select({ zoneId: zonePhotos.zoneId, blobUrl: zonePhotos.blobUrl })
      .from(zonePhotos)
      .where(eq(zonePhotos.isPrimary, true)),
    db.select().from(zoneNotes).where(eq(zoneNotes.zoneId, zoneId)).orderBy(zoneNotes.createdAt),
  ]);

  const photoByPlant = new Map(primaryPhotos.map((p) => [p.plantId, p.blobUrl]));
  const photoByAnimal = new Map(primaryAnimalPhotos.map((a) => [a.animalId, a.blobUrl]));
  const latestSoilCheck = latestSoilCheckRows[0] ?? null;
  const photoByZone = new Map(primaryZonePhotos.map((p) => [p.zoneId, p.blobUrl]));
  const otherZones = allZoneRows
    .filter((z) => z.id !== zoneId)
    .map((z) => ({ id: z.id, name: z.name, imageUrl: photoByZone.get(z.id) ?? null }));

  const assignedPlants = assignments.map((a) => ({
    id: a.plantId,
    name: a.germanName ?? a.scientificName,
    photoUrl: photoByPlant.get(a.plantId) ?? null,
  }));

  const allPlants = allPlantRows.map((p) => ({
    id: p.id,
    name: p.germanName ?? p.scientificName,
    photoUrl: photoByPlant.get(p.id) ?? null,
  }));

  const assignedAnimals = animalAssignments.map((a) => ({
    id: a.animalId,
    name: a.germanName ?? a.commonName ?? a.scientificName,
    photoUrl: photoByAnimal.get(a.animalId) ?? null,
  }));

  const allAnimals = allAnimalRows.map((a) => ({
    id: a.id,
    name: a.germanName ?? a.commonName ?? a.scientificName,
    photoUrl: photoByAnimal.get(a.id) ?? null,
  }));

  const Icon = lightIcon[zone.light];

  return (
    <div className="flex flex-col gap-6">
      <ZoneHero zoneId={zone.id} photos={zonePhotoRows} name={zone.name} />

      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl text-forest">{zone.name}</h1>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-sun/40 px-2.5 py-1 text-sun-text">
            <Icon className="h-3.5 w-3.5" />
            {zone.light}
          </span>
          <span className="rounded-full bg-water/40 px-2.5 py-1 text-water-text">
            {orientationLabel[zone.orientation]}
          </span>
          {zone.soilType && (
            <span className="rounded-full bg-soil/40 px-2.5 py-1 text-soil-text">
              {zone.soilType}
            </span>
          )}
        </div>

        {zone.notes && <p className="text-sm text-forest-muted">{zone.notes}</p>}

        <SoilSection zoneId={zone.id} latestCheck={latestSoilCheck} />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-forest">Pflanzen</h2>
          <ZonePlants zoneId={zone.id} assignedPlants={assignedPlants} allPlants={allPlants} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-forest">Tiere</h2>
          <ZoneAnimals zoneId={zone.id} assignedAnimals={assignedAnimals} allAnimals={allAnimals} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-forest">Notizen</h2>
          <NoteList
            notes={notes}
            onAdd={addZoneNote.bind(null, zone.id)}
            onDelete={deleteZoneNote.bind(null, zone.id)}
          />
        </section>

        <div className="mt-2 border-t border-border pt-4">
          <ZoneDetailActions
            zone={{
              id: zone.id,
              name: zone.name,
              light: zone.light,
              orientation: zone.orientation,
              soilType: zone.soilType ?? "",
              notes: zone.notes ?? "",
            }}
          />
        </div>

        <OtherZonesOverview zones={otherZones} />
      </div>
    </div>
  );
}
