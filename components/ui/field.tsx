export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-forest-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClasses =
  "min-h-11 rounded-xl border border-border bg-warm-white px-3.5 py-2.5 text-sm text-forest placeholder:text-forest-muted/60 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30";

export const selectClasses = inputClasses + " appearance-none";
