import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { animals, animalPhotos, animalNotes, animalZoneAssignments, zones, zonePhotos } from "@/lib/db/schema";
import { AnimalHero } from "@/components/animals/animal-hero";
import { AnimalPhotoGallery } from "@/components/animals/animal-photo-gallery";
import { EnrichmentStatusAnimal } from "@/components/animals/enrichment-status-animal";
import { ZoneChipsAnimal } from "@/components/animals/zone-chips-animal";
import { SpeciesCorrectionAnimal } from "@/components/animals/species-correction-animal";
import { DeleteAnimalButton } from "@/components/animals/delete-animal-button";
import { NoteList } from "@/components/ui/note-list";
import { addAnimalNote, deleteAnimalNote } from "@/lib/actions/animals";

export default async function TierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animalId = Number(id);
  if (Number.isNaN(animalId)) notFound();
  if (!isDbConfigured) notFound();

  const db = getDb();
  const [animal] = await db.select().from(animals).where(eq(animals.id, animalId)).limit(1);
  if (!animal) notFound();

  const [photos, notes, assignedZoneRows, allZoneRows, primaryZonePhotos] = await Promise.all([
    db
      .select()
      .from(animalPhotos)
      .where(eq(animalPhotos.animalId, animalId))
      .orderBy(animalPhotos.id),
    db.select().from(animalNotes).where(eq(animalNotes.animalId, animalId)).orderBy(animalNotes.createdAt),
    db
      .select({ id: zones.id, name: zones.name })
      .from(animalZoneAssignments)
      .innerJoin(zones, eq(animalZoneAssignments.zoneId, zones.id))
      .where(eq(animalZoneAssignments.animalId, animalId)),
    db
      .select({ id: zones.id, name: zones.name })
      .from(zones)
      .orderBy(zones.name),
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
      <AnimalHero animalId={animal.id} photos={photos} alt={animal.germanName ?? animal.scientificName} />

      <div className="flex w-full flex-col gap-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl text-forest">
              {animal.germanName ?? animal.scientificName}
            </h1>
            <p className="italic text-forest-muted">{animal.scientificName}</p>
          </div>
          <SpeciesCorrectionAnimal animalId={animal.id} />
        </div>

        <ZoneChipsAnimal animalId={animal.id} assignedZones={assignedZones} allZones={allZones} />

        {animal.factsText && (
          <p className="text-sm leading-relaxed text-forest">{animal.factsText}</p>
        )}

        <EnrichmentStatusAnimal
          animalId={animal.id}
          status={animal.enrichmentStatus}
          error={animal.enrichmentError}
        />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-forest">Fotos</h2>
          <AnimalPhotoGallery animalId={animal.id} photos={photos} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-forest">Notizen</h2>
          <NoteList
            notes={notes}
            onAdd={addAnimalNote.bind(null, animal.id)}
            onDelete={deleteAnimalNote.bind(null, animal.id)}
          />
        </section>

        <div className="mt-2 border-t border-border pt-4">
          <DeleteAnimalButton animalId={animal.id} />
        </div>
      </div>
    </div>
  );
}
