"use client";

export function ZoneMultiSelect({
  zones,
  selected,
  onToggle,
}: {
  zones: { id: number; name: string }[];
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
      {zones.map((z) => (
        <label
          key={z.id}
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-forest has-[:checked]:border-sage has-[:checked]:bg-sage/10"
        >
          <input
            type="checkbox"
            checked={selected.has(z.id)}
            onChange={() => onToggle(z.id)}
            className="h-4 w-4 accent-sage"
          />
          {z.name}
        </label>
      ))}
    </div>
  );
}
