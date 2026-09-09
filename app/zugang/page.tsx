import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { accessCodeConfigured } from "@/lib/access-token";
import { submitAccessCode } from "@/lib/actions/access";

export const metadata: Metadata = {
  title: "Zugang — HORTTIA",
  robots: { index: false, follow: false },
};

export default async function ZugangPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  const { fehler } = await searchParams;
  const eingerichtet = accessCodeConfigured();

  // Erscheint nur, wenn eine Schaufenster-Adresse hinterlegt ist. Ohne die
  // Variable gibt es den Knopf nicht — so kann er nie ins Leere zeigen.
  const demoUrl = process.env.DEMO_URL?.startsWith("http")
    ? process.env.DEMO_URL
    : null;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-warm-white p-7 shadow-sm">
        <h1 className="font-display text-[27px] text-forest">HORTTIA</h1>
        <p className="mt-1 text-sm text-forest-muted">
          Das Gartenjournal unserer Familie
        </p>

        {eingerichtet ? (
          <form action={submitAccessCode} className="mt-6 flex flex-col gap-3">
            <label htmlFor="code" className="text-sm font-medium text-forest">
              Zugangscode
            </label>
            <input
              id="code"
              name="code"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="min-h-11 rounded-xl border border-border bg-warm-white px-3.5 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            />

            {fehler === "1" && (
              <p className="rounded-xl bg-attention/20 px-3.5 py-2.5 text-sm text-attention-text">
                Der Code stimmt nicht. Bitte nochmals versuchen.
              </p>
            )}

            <Button type="submit" className="mt-1 w-full">
              Weiter
            </Button>
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-attention/20 px-3.5 py-2.5 text-sm text-attention-text">
            Es ist kein Zugangscode hinterlegt. Bitte die Umgebungsvariable{" "}
            <code className="font-mono">APP_ACCESS_CODE</code> setzen.
          </p>
        )}

        {demoUrl && (
          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-sm text-forest-muted">Nur schauen?</p>
            <a
              href={demoUrl}
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-warm-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-cream"
            >
              Demo ansehen
            </a>
            <p className="mt-2 text-xs text-forest-muted">
              Ein Beispielgarten zum Durchklicken — ohne Anmeldung.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
