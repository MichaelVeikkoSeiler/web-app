import Image from "next/image";
import { AlertCircle, StickyNote } from "lucide-react";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { AttentionList } from "@/components/home/attention-list";
import { NotesSection } from "@/components/home/notes-section";
import { getTodoItems } from "@/lib/plants-query";
import { HeroImage } from "@/components/home/hero-image";
import { getHeroImages } from "@/lib/actions/settings";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantNotes, plants, zoneNotes, animalNotes, animals } from "@/lib/db/schema";
import type { HomeNote } from "@/components/home/notes-section";

export default async function Home() {
  const [todoItems, heroPhotos, conflictRows, plantNoteRows, zoneNoteRows, animalNoteRows] = await Promise.all([
    getTodoItems(),
    getHeroImages(),
    isDbConfigured
      ? getDb()
          .select({
            zoneId: zones.id,
            zoneName: zones.name,
            label: zones.conflictLabel,
            text: zones.conflictText,
          })
          .from(zones)
          .where(and(eq(zones.conflictStatus, "done"), isNotNull(zones.conflictLabel)))
      : Promise.resolve([]),
    isDbConfigured
      ? getDb()
          .select({
            id: plantNotes.id,
            text: plantNotes.text,
            createdAt: plantNotes.createdAt,
            plantId: plantNotes.plantId,
            germanName: plants.germanName,
            scientificName: plants.scientificName,
          })
          .from(plantNotes)
          .innerJoin(plants, eq(plantNotes.plantId, plants.id))
      : Promise.resolve([]),
    isDbConfigured
      ? getDb()
          .select({
            id: zoneNotes.id,
            text: zoneNotes.text,
            createdAt: zoneNotes.createdAt,
            zoneId: zoneNotes.zoneId,
            zoneName: zones.name,
          })
          .from(zoneNotes)
          .innerJoin(zones, eq(zoneNotes.zoneId, zones.id))
      : Promise.resolve([]),
    isDbConfigured
      ? getDb()
          .select({
            id: animalNotes.id,
            text: animalNotes.text,
            createdAt: animalNotes.createdAt,
            animalId: animalNotes.animalId,
            germanName: animals.germanName,
            scientificName: animals.scientificName,
          })
          .from(animalNotes)
          .innerJoin(animals, eq(animalNotes.animalId, animals.id))
      : Promise.resolve([]),
  ]);

  const conflicts = conflictRows.map((c) => ({
    zoneId: c.zoneId,
    zoneName: c.zoneName,
    label: c.label!,
    text: c.text,
  }));

  const notes: HomeNote[] = [
    ...plantNoteRows.map((n) => ({
      id: n.id,
      kind: "plant" as const,
      text: n.text,
      createdAt: n.createdAt,
      href: `/pflanzen/${n.plantId}`,
      label: n.germanName ?? n.scientificName,
    })),
    ...zoneNoteRows.map((n) => ({
      id: n.id,
      kind: "zone" as const,
      text: n.text,
      createdAt: n.createdAt,
      href: `/zonen/${n.zoneId}`,
      label: n.zoneName,
    })),
    ...animalNoteRows.map((n) => ({
      id: n.id,
      kind: "animal" as const,
      text: n.text,
      createdAt: n.createdAt,
      href: `/tiere/${n.animalId}`,
      label: n.germanName ?? n.scientificName,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="flex flex-col gap-6">
      <HeroImage initialPhotos={heroPhotos} />

      <div className="text-center">
        <h1 className="font-display text-3xl text-forest sm:text-4xl">
          Unsere Gartenwelt
        </h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg text-forest">
          <AlertCircle className="h-5 w-5 text-attention-text" />
          Braucht deine Aufmerksamkeit
        </h2>
        <AttentionList items={todoItems} conflicts={conflicts} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg text-forest">
          <StickyNote className="h-5 w-5 text-care-text" />
          Notizen
        </h2>
        <NotesSection notes={notes} />
      </section>

      <Image
        src="/images/soil-mound.png"
        alt=""
        width={1536}
        height={289}
        className="h-auto w-full"
      />
    </div>
  );
}
