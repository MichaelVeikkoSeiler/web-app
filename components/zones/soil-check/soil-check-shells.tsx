"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScreenShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <h1 className="font-display text-2xl text-forest">{title}</h1>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
      <div className="mt-2">{footer}</div>
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-sage/10 px-3.5 py-2.5 text-sm text-forest-muted">{children}</p>;
}

export function InfoScreen({
  title,
  paragraphs,
  steps,
  materials,
  hint,
  nextLabel,
  onNext,
  footnote,
}: {
  title: string;
  paragraphs: string[];
  steps?: string[];
  materials?: string[];
  hint?: string;
  nextLabel: string;
  onNext: () => void;
  footnote?: string;
}) {
  return (
    <ScreenShell
      title={title}
      footer={
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={onNext}>
            {nextLabel}
          </Button>
          {footnote && <p className="text-center text-xs text-forest-muted">{footnote}</p>}
        </div>
      }
    >
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-forest">
          {p}
        </p>
      ))}
      {steps && (
        <ol className="flex flex-col gap-2 rounded-2xl border border-border bg-warm-white p-4 text-sm text-forest">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/30 text-xs font-semibold text-forest">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      )}
      {materials && (
        <ul className="flex flex-col gap-1.5 rounded-2xl bg-cream p-4 text-sm text-forest">
          {materials.map((m, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1 w-1 shrink-0 rounded-full bg-forest-muted" />
              {m}
            </li>
          ))}
        </ul>
      )}
      {hint && <Hint>{hint}</Hint>}
    </ScreenShell>
  );
}

export type Option<T extends string> = { value: T; label: string };

export function OptionCard<T extends string>({
  option,
  selected,
  onClick,
}: {
  option: Option<T>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3.5 text-left text-sm leading-relaxed transition-colors ${
        selected ? "border-sage bg-sage/10 text-forest" : "border-border bg-warm-white text-forest hover:border-sage"
      }`}
    >
      {option.label}
    </button>
  );
}

export function SingleChoiceScreen<T extends string>({
  title,
  text,
  options,
  value,
  onChange,
  hint,
  onNext,
}: {
  title: string;
  text?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  hint?: string;
  onNext: () => void;
}) {
  return (
    <ScreenShell
      title={title}
      footer={
        <Button className="w-full" disabled={!value} onClick={onNext}>
          Weiter
        </Button>
      }
    >
      {text && <p className="text-sm leading-relaxed text-forest">{text}</p>}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <OptionCard key={opt.value} option={opt} selected={value === opt.value} onClick={() => onChange(opt.value)} />
        ))}
      </div>
      {hint && <Hint>{hint}</Hint>}
    </ScreenShell>
  );
}

export function RetryScreen({
  reason,
  retryLabel,
  onRetry,
  onDismiss,
}: {
  reason: string;
  retryLabel: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <ScreenShell
      title="Kurz nachprüfen"
      footer={
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={onRetry}>
            {retryLabel}
          </Button>
          <button
            onClick={onDismiss}
            className="text-center text-sm font-medium text-forest-muted hover:text-forest"
          >
            Trotzdem so übernehmen
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3 rounded-2xl bg-attention/15 px-4 py-3.5 text-sm text-attention-text">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{reason} Das ergibt zusammen noch kein stimmiges Bild.</span>
      </div>
      <p className="text-sm leading-relaxed text-forest">
        Am zuverlässigsten ist es, die betroffene Probe noch einmal in Ruhe zu machen. Du kannst aber auch einfach so
        weitermachen, wenn du dir sicher bist.
      </p>
    </ScreenShell>
  );
}

export function MultiChoiceScreen<T extends string>({
  title,
  text,
  options,
  value,
  onChange,
  exclusiveValue,
  hint,
  onNext,
}: {
  title: string;
  text?: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  exclusiveValue?: T;
  hint?: string;
  onNext: () => void;
}) {
  function toggle(val: T) {
    if (exclusiveValue && val === exclusiveValue) {
      onChange([val]);
      return;
    }
    const withoutExclusive = value.filter((v) => v !== exclusiveValue);
    if (withoutExclusive.includes(val)) {
      onChange(withoutExclusive.filter((v) => v !== val));
    } else {
      onChange([...withoutExclusive, val]);
    }
  }

  return (
    <ScreenShell
      title={title}
      footer={
        <Button className="w-full" disabled={value.length === 0} onClick={onNext}>
          Weiter
        </Button>
      }
    >
      {text && <p className="text-sm leading-relaxed text-forest">{text}</p>}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <OptionCard key={opt.value} option={opt} selected={value.includes(opt.value)} onClick={() => toggle(opt.value)} />
        ))}
      </div>
      {hint && <Hint>{hint}</Hint>}
    </ScreenShell>
  );
}
