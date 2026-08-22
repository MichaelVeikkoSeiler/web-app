import { getPlantHighlights } from "@/lib/plants-query";
import { HighlightSections } from "@/components/besonderheiten/highlight-sections";

export default async function BesonderheitenPage() {
  const highlights = await getPlantHighlights();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Besonderes</h1>

      <HighlightSections highlights={highlights} />
    </div>
  );
}
