import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { STATUS_META } from "@/lib/plant-doc-status";

type CaseSummary = {
  id: number;
  status: keyof typeof STATUS_META;
  analysisStatus: "pending" | "done" | "failed";
  primaryCause: string | null;
  createdAt: Date;
};

export function PlantDocSection({
  plantId,
  cases,
}: {
  plantId: number;
  cases: CaseSummary[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-forest">Plant Doc</h2>
        <Link
          href={`/plant-doc/neu?plantId=${plantId}`}
          className="flex min-h-9 items-center gap-1.5 rounded-full bg-attention/20 px-3.5 text-sm font-medium text-attention-text hover:bg-attention/30"
        >
          <Stethoscope className="h-4 w-4" /> Fall starten
        </Link>
      </div>

      {cases.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/plant-doc/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-warm-white px-3.5 py-2.5 hover:border-sage"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-forest">
                {c.analysisStatus === "pending"
                  ? "Analyse läuft…"
                  : c.analysisStatus === "failed"
                    ? "Analyse fehlgeschlagen"
                    : (c.primaryCause ?? "Keine eindeutige Ursache")}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[c.status]?.className ?? "bg-cream text-forest-muted"}`}
              >
                {STATUS_META[c.status]?.label ?? c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
