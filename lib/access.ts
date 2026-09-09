/**
 * Zugangsprüfung für Server Actions und Server Components.
 *
 * `requireAccess()` steht am Anfang jeder Server Action. Das ist bewusst
 * doppelt gemoppelt — der Proxy prüft bereits jeden Aufruf. Die Next.js-
 * Dokumentation begründet es so: Server Actions sind POST-Anfragen an die
 * Route, in der sie verwendet werden. Zieht man eine Action später in eine
 * andere Datei um, kann sie lautlos aus dem Proxy-Muster herausfallen.
 * Die Prüfung in der Action selbst hält auch dann.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, accessTokenIsValid, isDemoMode } from "@/lib/access-token";

export async function hasAccess(): Promise<boolean> {
  const store = await cookies();
  return accessTokenIsValid(store.get(ACCESS_COOKIE)?.value);
}

/**
 * Bricht ab, wenn kein gültiges Cookie vorliegt — oder wenn diese Bereitstellung
 * das Schaufenster ist.
 *
 * Steht am Anfang jeder verändernden Server Action. Weil `hasAccess()` selbst
 * NICHT auf den Demo-Modus schaut, bleibt der Upload-Endpunkt im Schaufenster
 * ebenfalls verschlossen: Dort gibt es kein Cookie, also kommt dort nichts an.
 */
export async function requireAccess(): Promise<void> {
  if (isDemoMode()) redirect("/demo-hinweis");
  if (!(await hasAccess())) redirect("/zugang");
}

/**
 * Für rein lesende Actions, die auch im Schaufenster laufen dürfen.
 *
 * Der Unterschied zu `requireAccess()`: Im Demo-Modus wird durchgelassen statt
 * abgewiesen. Bewusst sparsam eingesetzt — nur dort, wo nichts geschrieben wird
 * UND kein kostenpflichtiger Dienst angerufen wird. Die Arterkennung etwa bleibt
 * gesperrt, obwohl sie nichts schreibt: Sie kostet Geld.
 */
export async function requireReadAccess(): Promise<void> {
  if (isDemoMode()) return;
  if (!(await hasAccess())) redirect("/zugang");
}
