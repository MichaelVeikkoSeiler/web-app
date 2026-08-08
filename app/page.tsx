import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { PlantCard } from "@/components/plants/plant-card";
import { getPlantCards } from "@/lib/plants-query";
import { HeroImage } from "@/components/home/hero-image";
import { getHeroImageUrl } from "@/lib/actions/settings";

export default async function Home() {
  const [plants, heroImageUrl] = await Promise.all([
    getPlantCards(),
    getHeroImageUrl(),
  ]);
  const needsHelp = plants.filter((p) => p.needsHelp);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-forest sm:text-4xl">
          Willkommen in deinem Garten
        </h1>
        <p className="mt-1 text-lg text-forest-muted">Euer digitales Gartenjournal</p>
      </div>

      <HeroImage initialUrl={heroImageUrl} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg text-forest">
            <AlertCircle className="h-5 w-5 text-attention-text" />
            Braucht Aufmerksamkeit
          </h2>
          {needsHelp.length > 0 && (
            <Link
              href="/pflanzen"
              className="flex items-center gap-1 text-sm font-medium text-forest-muted hover:text-forest"
            >
              Alle <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {needsHelp.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
            Aktuell braucht keine Pflanze besondere Aufmerksamkeit.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {needsHelp.map((p) => (
              <PlantCard key={p.id} plant={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
