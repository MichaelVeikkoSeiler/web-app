import { AlertCircle, StickyNote } from "lucide-react";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { AttentionList } from "@/components/home/attention-list";
import { NotesSection } from "@/components/home/notes-section";
import { getTodoItems } from "@/lib/plants-query";
import { HeroImage } from "@/components/home/hero-image";
import { getHeroImages } from "@/lib/actions/settings";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones, plantNotes, plants } from "@/lib/db/schema";

export default async function Home() {
  const [todoItems, heroPhotos, conflictRows, noteRows] = await Promise.all([
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
            plantId: plantNotes.plantId,
            germanName: plants.germanName,
            scientificName: plants.scientificName,
          })
          .from(plantNotes)
          .innerJoin(plants, eq(plantNotes.plantId, plants.id))
          .orderBy(desc(plantNotes.createdAt))
      : Promise.resolve([]),
  ]);

  const conflicts = conflictRows.map((c) => ({
    zoneId: c.zoneId,
    zoneName: c.zoneName,
    label: c.label!,
    text: c.text,
  }));

  const notes = noteRows.map((n) => ({
    id: n.id,
    text: n.text,
    plantId: n.plantId,
    plantName: n.germanName ?? n.scientificName,
  }));

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
    </div>
  );
}
