"use client";

import { useState, useTransition } from "react";
import { Field, inputClasses } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createZone, updateZone, type ZoneInput } from "@/lib/actions/zones";

export function ZoneForm({
  zone,
  onDone,
}: {
  zone?: { id: number } & ZoneInput;
  onDone: () => void;
}) {
  const [form, setForm] = useState<ZoneInput>({
    name: zone?.name ?? "",
    notes: zone?.notes ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (zone) {
          await updateZone(zone.id, form);
        } else {
          await createZone(form);
        }
        onDone();
      } catch {
        setError("Speichern fehlgeschlagen. Bitte Angaben prüfen.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Name der Zone">
        <input
          required
          className={inputClasses}
          placeholder="z. B. Beet beim Gartenhaus"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>

      <Field label="Notizen (optional)">
        <textarea
          className={inputClasses + " min-h-20 resize-y"}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      {error && <p className="text-sm text-attention-text">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Speichert…" : zone ? "Zone speichern" : "Zone anlegen"}
      </Button>
    </form>
  );
}
