import Link from "next/link";
import { Leaf, MapPinned } from "lucide-react";

export type HomeNote = {
  id: number;
  kind: "plant" | "zone";
  text: string;
  createdAt: Date;
  href: string;
  label: string;
};

const kindIcon = { plant: Leaf, zone: MapPinned };

export function NotesSection({ notes }: { notes: HomeNote[] }) {
  if (notes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white p-6 text-sm text-forest-muted">
        Noch keine Notizen vorhanden.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notes.map((n) => {
        const Icon = kindIcon[n.kind];
        return (
          <Link
            key={`${n.kind}-${n.id}`}
            href={n.href}
            className="flex items-start gap-3 rounded-2xl border border-border bg-warm-white px-4 py-3 hover:border-sage"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-forest-muted" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-forest">{n.text}</p>
              <span className="text-xs text-forest-muted">{n.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
