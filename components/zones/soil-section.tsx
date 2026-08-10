import Link from "next/link";
import { Shovel } from "lucide-react";

const TEXTURE_LABEL: Record<string, string> = {
  sandig: "Sandig",
  "sandig-lehmig": "Sandig-lehmig",
  lehmig: "Lehmig",
  "tonig-lehmig": "Tonig-lehmig",
  tonig: "Tonig",
};

type LatestSoilCheck = {
  soilTexture: string;
  phValue: number;
  drainageClass: string;
} | null;

export function SoilSection({
  zoneId,
  latestCheck,
}: {
  zoneId: number;
  latestCheck: LatestSoilCheck;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-forest">Boden</h2>
        <Link
          href={`/zonen/${zoneId}/bodencheck`}
          className="flex min-h-9 items-center gap-1.5 rounded-full bg-soil/30 px-3.5 text-sm font-medium text-soil-text hover:bg-soil/45"
        >
          <Shovel className="h-4 w-4" /> {latestCheck ? "Bodencheck aktualisieren" : "Bodencheck starten"}
        </Link>
      </div>
      <p className="text-sm text-forest-muted">
        {latestCheck
          ? `${TEXTURE_LABEL[latestCheck.soilTexture] ?? latestCheck.soilTexture} · pH ${latestCheck.phValue.toFixed(1).replace(".", ",")} · Drainage ${latestCheck.drainageClass}`
          : "Noch nicht analysiert"}
      </p>
    </section>
  );
}
