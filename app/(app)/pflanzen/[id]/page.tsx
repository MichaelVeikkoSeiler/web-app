import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos, plantNotes, plantZoneAssignments, zones, plantDocCases, zonePhotos } from "@/lib/db/schema";
import { CareInfoGrid } from "@/components/plants/care-info-grid";
import { NoteList } from "@/components/ui/note-list";
import { PhotoGallery } from "@/components/plants/photo-gallery";
import { PlantHero } from "@/components/plants/plant-hero";
import { EnrichmentStatus } from "@/components/plants/enrichment-status";
import { ZoneChips } from "@/components/plants/zone-chips";
import { DeletePlantButton } from "@/components/plants/delete-plant-button";
import { SpeciesCorrection } from "@/components/plants/species-correction";
import { PlantDocSection } from "@/components/plant-doc/plant-doc-section";
import { addNote, deleteNote } from "@/lib/actions/plants";

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

  const [photos, notes, assignedZoneRows, allZoneRows, plantDocCasesForPlant, primaryZonePhotos] = await Promise.all([
    db
      .select()
      .from(plantPhotos)
      .where(eq(plantPhotos.plantId, plantId))
      .orderBy(plantPhotos.id),
    db.select().from(plantNotes).where(eq(plantNotes.plantId, plantId)).orderBy(plantNotes.createdAt),
    db
      .select({ id: zones.id, name: zones.name })
      .from(plantZoneAssignments)
      .innerJoin(zones, eq(plantZoneAssignments.zoneId, zones.id))
      .where(eq(plantZoneAssignments.plantId, plantId)),
    db
      .select({ id: zones.id, name: zones.name })
      .from(zones)
      .orderBy(zones.name),
    db
      .select({
        id: plantDocCases.id,
        status: plantDocCases.status,
        analysisStatus: plantDocCases.analysisStatus,
        primaryCause: plantDocCases.primaryCause,
        createdAt: plantDocCases.createdAt,
      })
      .from(plantDocCases)
      .where(eq(plantDocCases.plantId, plantId))
      .orderBy(desc(plantDocCases.createdAt)),
    db
      .select({ zoneId: zonePhotos.zoneId, blobUrl: zonePhotos.blobUrl })
      .from(zonePhotos)
      .where(eq(zonePhotos.isPrimary, true)),
  ]);

  const photoByZone = new Map(primaryZonePhotos.map((p) => [p.zoneId, p.blobUrl]));
  const assignedZones = assignedZoneRows.map((z) => ({ ...z, imageUrl: photoByZone.get(z.id) ?? null }));
  const allZones = allZoneRows.map((z) => ({ ...z, imageUrl: photoByZone.get(z.id) ?? null }));

  return (
    <div className="flex flex-col gap-6">
      <PlantHero plantId={plant.id} photos={photos} alt={plant.germanName ?? plant.scientificName} />

      <div className="flex w-full flex-col gap-6">
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

        <PlantDocSection plantId={plant.id} cases={plantDocCasesForPlant} />

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
          <NoteList
            notes={notes}
            onAdd={addNote.bind(null, plant.id)}
            onDelete={deleteNote.bind(null, plant.id)}
          />
        </section>

        <div className="mt-2 border-t border-border pt-4">
          <DeletePlantButton plantId={plant.id} />
        </div>
      </div>
    </div>
  );
}
