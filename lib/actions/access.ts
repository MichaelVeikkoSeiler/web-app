"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  accessCodeIsCorrect,
  makeAccessToken,
} from "@/lib/access-token";

/**
 * Nimmt den eingegebenen Zugangscode entgegen und stellt bei Erfolg das Cookie aus.
 *
 * ACHTUNG: Diese Datei ist die einzige unter lib/actions/, die bewusst KEIN
 * `requireAccess()` enthält — sonst käme niemand mehr herein. Beim Hinzufügen
 * weiterer Actions hier daran denken.
 */

const EIN_JAHR = 60 * 60 * 24 * 365;

export async function submitAccessCode(formData: FormData) {
  const eingabe = String(formData.get("code") ?? "");
  const token = accessCodeIsCorrect(eingabe) ? makeAccessToken() : null;

  if (!token) {
    redirect("/zugang?fehler=1");
  }

  const store = await cookies();
  store.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EIN_JAHR,
  });

  redirect("/");
}

/** Meldet ab, indem das Cookie entfernt wird. */
export async function clearAccess() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  redirect("/zugang");
}
