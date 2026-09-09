/**
 * Zugangsschutz — reine Funktionen ohne Zugriff auf Request oder Cookies.
 *
 * Bewusst frei von Next.js-Importen, damit sowohl `proxy.ts` als auch die
 * Server Actions dieselbe Logik verwenden können. Die Next.js-Dokumentation
 * rät davon ab, im Proxy auf gemeinsamen Zustand zuzugreifen — reine
 * Funktionen ohne Seiteneffekte sind davon nicht betroffen.
 *
 * Verfahren: Aus dem gemeinsamen Zugangscode wird ein HMAC gebildet und als
 * Cookie abgelegt. Der Code selbst verlässt den Server nie. Ändert man ihn,
 * werden dadurch automatisch alle ausgestellten Cookies ungültig.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "horttia_zugang";

/** Fester Text, aus dem der Cookie-Wert abgeleitet wird. */
const TOKEN_SUBJECT = "horttia-zugang-v1";

/** Vergleich ohne Zeitunterschied — beide Seiten werden vorher gehasht,
 *  damit auch die Länge der Eingabe nichts verrät. */
function equalsSecurely(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function accessCodeConfigured(): boolean {
  return Boolean(process.env.APP_ACCESS_CODE);
}

/** Cookie-Wert zum aktuellen Zugangscode. */
export function makeAccessToken(): string | null {
  const code = process.env.APP_ACCESS_CODE;
  if (!code) return null;
  return createHmac("sha256", code).update(TOKEN_SUBJECT).digest("hex");
}

/** Prüft einen vorgelegten Cookie-Wert. */
export function accessTokenIsValid(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = makeAccessToken();
  if (!expected) return false; // Kein Code gesetzt -> niemand kommt rein
  return equalsSecurely(token, expected);
}

/** Prüft den eingegebenen Zugangscode. */
export function accessCodeIsCorrect(input: string): boolean {
  const code = process.env.APP_ACCESS_CODE;
  if (!code) return false;
  return equalsSecurely(input, code);
}
