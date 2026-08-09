import { AlertCircle } from "lucide-react";
import { eq, and, isNotNull } from "drizzle-orm";
import { AttentionList } from "@/components/home/attention-list";
import { getTodoItems } from "@/lib/plants-query";
import { HeroImage } from "@/components/home/hero-image";
import { getHeroImageUrl } from "@/lib/actions/settings";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones } from "@/lib/db/schema";

export default async function Home() {
  const [todoItems, heroImageUrl, conflictRows] = await Promise.all([
    getTodoItems(),
    getHeroImageUrl(),
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
  ]);

  const conflicts = conflictRows.map((c) => ({
    zoneId: c.zoneId,
    zoneName: c.zoneName,
    label: c.label!,
    text: c.text,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative left-1/2 -mt-4 w-screen -ml-[50vw] sm:-mt-8">
        <HeroImage initialUrl={heroImageUrl} />
      </div>

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
    </div>
  );
}
