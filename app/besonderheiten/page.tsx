import Link from "next/link";
import { Droplets, Flower2, Flame, Feather, Sparkles, type LucideIcon } from "lucide-react";
import { getPlantHighlights, type RankedHighlight } from "@/lib/plants-query";
import {
  getBesonderheitenHeroImageUrl,
  setBesonderheitenHeroImage,
  clearBesonderheitenHeroImage,
} from "@/lib/actions/settings";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function BesonderheitenPage() {
  const [highlights, heroImageUrl] = await Promise.all([
    getPlantHighlights(),
    getBesonderheitenHeroImageUrl(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Speziell"
        uploadLabel="Bild hochladen"
        onUpload={setBesonderheitenHeroImage}
        onDelete={clearBesonderheitenHeroImage}
      />

      <h1 className="flex items-center gap-2 font-display text-2xl text-forest">
        <Sparkles className="h-6 w-6 text-forest-muted" strokeWidth={1.75} />
        Speziell
      </h1>

      <Section
        icon={Droplets}
        colorClass="bg-water/40 text-water-text"
        title="Braucht am meisten Wasser"
        items={highlights.mostWater}
        emptyText="Keine Angabe zum Giessrhythmus vorhanden."
      />

      <Section
        icon={Droplets}
        colorClass="bg-water/40 text-water-text"
        title="Braucht am wenigsten Wasser"
        items={highlights.leastWater}
        emptyText="Keine Angabe zum Giessrhythmus vorhanden."
      />

      <Section
        icon={Flower2}
        colorClass="bg-bloom/40 text-bloom-text"
        title="Blüht am längsten"
        items={highlights.longestBloom}
        emptyText="Keine Angabe zur Blütezeit vorhanden."
      />

      <Section
        icon={Flower2}
        colorClass="bg-bloom/40 text-bloom-text"
        title="Blüht am wenigsten lang"
        items={highlights.shortestBloom}
        emptyText="Keine Angabe zur Blütezeit vorhanden."
      />

      <Section
        icon={Flame}
        colorClass="bg-sun/40 text-sun-text"
        title="Allgemein am anspruchsvollsten"
        items={highlights.mostDemanding}
        emptyText="Keine Angabe zum Pflegeaufwand vorhanden."
      />

      <Section
        icon={Feather}
        colorClass="bg-soil/40 text-soil-text"
        title="Allgemein am pflegeleichtesten"
        items={highlights.leastDemanding}
        emptyText="Keine Angabe zum Pflegeaufwand vorhanden."
      />
    </div>
  );
}

function Section({
  icon: Icon,
  colorClass,
  title,
  items,
  emptyText,
}: {
  icon: LucideIcon;
  colorClass: string;
  title: string;
  items: RankedHighlight[];
  emptyText: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-forest">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        {title}
      </h2>
      <div className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="px-2 py-1 text-sm text-forest-muted">{emptyText}</p>
        ) : (
          items.map((p, i) => (
            <Link
              key={p.plantId}
              href={`/pflanzen/${p.plantId}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-cream"
            >
              <span className="w-5 shrink-0 text-xs text-forest-muted">{i + 1}.</span>
              <span className="flex-1 text-forest">{p.plantName}</span>
              <span className="text-xs text-forest-muted">{p.display}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
