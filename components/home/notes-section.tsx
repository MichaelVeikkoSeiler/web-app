import Link from "next/link";

export type HomeNote = {
  id: number;
  text: string;
  plantId: number;
  plantName: string;
};

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
      {notes.map((n) => (
        <Link
          key={n.id}
          href={`/pflanzen/${n.plantId}`}
          className="flex flex-col gap-1 rounded-2xl border border-border bg-warm-white px-4 py-3 hover:border-sage"
        >
          <p className="text-sm text-forest">{n.text}</p>
          <span className="text-xs text-forest-muted">{n.plantName}</span>
        </Link>
      ))}
    </div>
  );
}
