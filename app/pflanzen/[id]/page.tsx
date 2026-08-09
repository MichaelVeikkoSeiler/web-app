import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos, plantNotes, plantZoneAssignments, zones } from "@/lib/db/schema";
import { CareInfoGrid } from "@/components/plants/care-info-grid";
import { NoteList } from "@/components/plants/note-list";
import { PhotoGallery } from "@/components/plants/photo-gallery";
import { PlantHero } from "@/components/plants/plant-hero";
import { EnrichmentStatus } from "@/components/plants/enrichment-status";
import { ZoneChips } from "@/components/plants/zone-chips";
import { DeletePlantButton } from "@/components/plants/delete-plant-button";
import { SpeciesCorrection } from "@/components/plants/species-correction";

export default async function PflanzeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plantId = Number(id);
  if (Number.isNaN(plantId)) notFound();
  if (!isDbConfigured) notFound();

  const db = getDb();
  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId)).limit(1);
  if (!plant) notFound();

  const [photos, notes, assignedZones, allZones] = await Promise.all([
    db
      .select()
      .from(plantPhotos)
      .where(eq(plantPhotos.plantId, plantId))
      .orderBy(plantPhotos.isPrimary),
    db.select().from(plantNotes).where(eq(plantNotes.plantId, plantId)).orderBy(plantNotes.createdAt),
    db
      .select({ id: zones.id, name: zones.name, imageUrl: zones.imageUrl })
      .from(plantZoneAssignments)
      .innerJoin(zones, eq(plantZoneAssignments.zoneId, zones.id))
      .where(eq(plantZoneAssignments.plantId, plantId)),
    db
      .select({ id: zones.id, name: zones.name, imageUrl: zones.imageUrl })
      .from(zones)
      .orderBy(zones.name),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PlantHero photos={photos} alt={plant.germanName ?? plant.scientificName} />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl text-forest">
            {plant.germanName ?? plant.scientificName}
          </h1>
          <p className="italic text-forest-muted">{plant.scientificName}</p>
        </div>
        <SpeciesCorrection plantId={plant.id} />
      </div>

      <ZoneChips plantId={plant.id} assignedZones={assignedZones} allZones={allZones} />

      {plant.factsText && (
        <p className="text-sm leading-relaxed text-forest">{plant.factsText}</p>
      )}

      <EnrichmentStatus
        plantId={plant.id}
        status={plant.enrichmentStatus}
        error={plant.enrichmentError}
      />

      {plant.enrichmentStatus === "done" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-forest">Pflege</h2>
          <CareInfoGrid plant={plant} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-forest">Fotos</h2>
        <PhotoGallery plantId={plant.id} photos={photos} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-forest">Notizen</h2>
        <NoteList plantId={plant.id} notes={notes} />
      </section>

      <div className="mt-2 border-t border-border pt-4">
        <DeletePlantButton plantId={plant.id} />
      </div>
    </div>
  );
}
