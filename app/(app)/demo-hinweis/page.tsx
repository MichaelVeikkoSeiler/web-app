import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Landet hier, wer im Schaufenster etwas zu ändern versucht.
 *
 * Bewusst eine eigene Seite statt einer Fehlermeldung: Server Actions
 * verbergen ihre Fehlertexte in der Produktion, es käme also nur ein
 * nichtssagendes «Es ist ein Fehler aufgetreten» an.
 */
export const metadata = { title: "Schaufenster-Ansicht — HORTTIA" };

export default function DemoHinweisPage() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="font-display text-2xl text-forest">Nur zum Anschauen</h1>
      <p className="mt-3 text-sm text-forest-muted">
        Du siehst eine Schaufenster-Ansicht von HORTTIA. Stöbern, blättern und
        spielen geht — aber Änderungen sind hier abgeschaltet, damit der Garten
        für alle Besucherinnen und Besucher gleich bleibt.
      </p>
      <Link href="/" className="mt-6 inline-block">
        <Button variant="secondary">Zurück zum Garten</Button>
      </Link>
    </div>
  );
}
