"use client";

import { useState, useTransition } from "react";
import { Field, inputClasses, selectClasses } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createZone, updateZone, type ZoneInput } from "@/lib/actions/zones";

const soilSuggestions = ["Lehm", "Sand", "Ton", "Humus", "Kies", "Lehmig-humos"];

export function ZoneForm({
  zone,
  onDone,
}: {
  zone?: { id: number } & ZoneInput;
  onDone: () => void;
}) {
  const [form, setForm] = useState<ZoneInput>({
    name: zone?.name ?? "",
    light: zone?.light ?? "halbschattig",
    orientation: zone?.orientation ?? "S",
    soilType: zone?.soilType ?? "",
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

      <Field label="Lichtverhältnis">
        <select
          className={selectClasses}
          value={form.light}
          onChange={(e) =>
            setForm({ ...form, light: e.target.value as ZoneInput["light"] })
          }
        >
          <option value="sonnig">Sonnig</option>
          <option value="halbschattig">Halbschattig</option>
          <option value="schattig">Schattig</option>
        </select>
      </Field>

      <Field label="Himmelsrichtung">
        <select
          className={selectClasses}
          value={form.orientation}
          onChange={(e) =>
            setForm({
              ...form,
              orientation: e.target.value as ZoneInput["orientation"],
            })
          }
        >
          <option value="N">Norden</option>
          <option value="O">Osten</option>
          <option value="S">Süden</option>
          <option value="W">Westen</option>
        </select>
      </Field>

      <Field label="Bodenart">
        <input
          list="soil-suggestions"
          className={inputClasses}
          placeholder="z. B. Lehm"
          value={form.soilType}
          onChange={(e) => setForm({ ...form, soilType: e.target.value })}
        />
        <datalist id="soil-suggestions">
          {soilSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
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
