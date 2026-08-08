"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addNote, deleteNote } from "@/lib/actions/plants";
import { Button } from "@/components/ui/button";

type Note = { id: number; text: string; createdAt: Date | string };

export function NoteList({ plantId, notes }: { plantId: number; notes: Note[] }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      await addNote(plantId, text);
      setText("");
      setAdding(false);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {notes.map((n) => (
        <div
          key={n.id}
          className="flex items-start justify-between gap-2 rounded-xl bg-cream px-3.5 py-2.5"
        >
          <p className="text-sm text-forest">{n.text}</p>
          <button
            aria-label="Notiz löschen"
            onClick={() => startTransition(() => deleteNote(n.id, plantId))}
            className="shrink-0 text-forest-muted hover:text-attention-text"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            className="min-h-16 rounded-xl border border-border bg-warm-white px-3.5 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Notiz eingeben…"
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Abbrechen
            </Button>
            <Button onClick={submit} disabled={pending}>
              Speichern
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex min-h-11 items-center gap-2 self-start rounded-full border border-dashed border-border px-4 text-sm font-medium text-forest-muted hover:border-sage hover:text-forest"
        >
          <Plus className="h-4 w-4" /> Notiz hinzufügen
        </button>
      )}
    </div>
  );
}
