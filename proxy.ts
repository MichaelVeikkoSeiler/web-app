import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, accessTokenIsValid } from "@/lib/access-token";

/**
 * Erste Verteidigungslinie: Ohne gültiges Zugangs-Cookie kommt keine Anfrage
 * bis zur Seite durch.
 *
 * Heisst in Next.js 16 `proxy` — die frühere Datei `middleware.ts` ist
 * abgekündigt. Läuft in der Node.js-Laufzeitumgebung, deshalb steht `crypto`
 * zur Verfügung.
 *
 * Die zweite Linie sitzt in den Server Actions selbst (`requireAccess()`).
 */
export function proxy(request: NextRequest) {
  if (accessTokenIsValid(request.cookies.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.next();
  }

  // Schnittstellen bekommen eine klare Absage statt einer Weiterleitung,
  // mit der ein Programm nichts anfangen könnte.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/zugang", request.url));
}

export const config = {
  /**
   * Alles ist geschützt ausser:
   * - der Zugangsseite selbst (sonst käme man nie zur Eingabe)
   * - den Bausteinen, die diese Seite zum Anzeigen braucht
   *
   * Bewusst NICHT ausgenommen: /api/blob/upload. Der Endpunkt kostet Speicher
   * und muss ebenso geschützt sein wie der Rest.
   */
  matcher: ["/((?!zugang|_next/static|_next/image|favicon.ico|images|sounds|.*\\.svg$).*)"],
};
