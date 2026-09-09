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
import { ACCESS_COOKIE, accessTokenIsValid } from "@/lib/access-token";

export async function hasAccess(): Promise<boolean> {
  const store = await cookies();
  return accessTokenIsValid(store.get(ACCESS_COOKIE)?.value);
}

/** Bricht ab und leitet zur Zugangsseite, wenn kein gültiges Cookie vorliegt. */
export async function requireAccess(): Promise<void> {
  if (!(await hasAccess())) redirect("/zugang");
}
