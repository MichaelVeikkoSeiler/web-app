import Link from "next/link";
import { Droplets, Flower2, Scissors, Sparkles, type LucideIcon } from "lucide-react";
import { getPlantHighlights, type HighlightPlant } from "@/lib/plants-query";
import { monthName } from "@/lib/date-utils";

export default async function BesonderheitenPage() {
  const highlights = await getPlantHighlights();
  const month = monthName(new Date().getMonth() + 1);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 font-display text-2xl text-forest">
        <Sparkles className="h-6 w-6 text-forest-muted" strokeWidth={1.75} />
        Besonderheiten
      </h1>

      <Section icon={Droplets} colorClass="bg-water/40 text-water-text" title="Giesst am häufigsten">
        {highlights.mostFrequentWatering.length === 0 ? (
          <EmptyRow text="Keine Angabe zum Giessrhythmus vorhanden." />
        ) : (
          highlights.mostFrequentWatering.map((p) => (
            <PlantRow key={p.plantId} plant={p} detail={`alle ${p.rhythmDays} Tage`} />
          ))
        )}
      </Section>

      <Section icon={Droplets} colorClass="bg-water/40 text-water-text" title="Giesst am seltensten">
        {highlights.leastFrequentWatering.length === 0 ? (
          <EmptyRow text="Keine Angabe zum Giessrhythmus vorhanden." />
        ) : (
          highlights.leastFrequentWatering.map((p) => (
            <PlantRow key={p.plantId} plant={p} detail={`alle ${p.rhythmDays} Tage`} />
          ))
        )}
      </Section>

      <Section icon={Flower2} colorClass="bg-bloom/40 text-bloom-text" title={`Blütezeit im ${month}`}>
        {highlights.bloomingThisMonth.length === 0 ? (
          <EmptyRow text="Keine Pflanze blüht diesen Monat." />
        ) : (
          highlights.bloomingThisMonth.map((p) => <PlantRow key={p.plantId} plant={p} />)
        )}
      </Section>

      <Section icon={Scissors} colorClass="bg-care/40 text-care-text" title={`Rückschnitt im ${month}`}>
        {highlights.pruningThisMonth.length === 0 ? (
          <EmptyRow text="Keine Pflanze braucht diesen Monat Rückschnitt." />
        ) : (
          highlights.pruningThisMonth.map((p) => <PlantRow key={p.plantId} plant={p} />)
        )}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  colorClass,
  title,
  children,
}: {
  icon: LucideIcon;
  colorClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-forest">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function PlantRow({ plant, detail }: { plant: HighlightPlant; detail?: string }) {
  return (
    <Link
      href={`/pflanzen/${plant.plantId}`}
      className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm hover:bg-cream"
    >
      <span className="text-forest">{plant.plantName}</span>
      {detail && <span className="text-xs text-forest-muted">{detail}</span>}
    </Link>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-2 py-1 text-sm text-forest-muted">{text}</p>;
}
