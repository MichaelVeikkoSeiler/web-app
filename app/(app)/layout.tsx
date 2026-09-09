import { AppShell } from "@/components/layout/app-shell";

/**
 * Rahmen für den angemeldeten Bereich: Kopfzeile, Navigation, Fussgrafik.
 *
 * Liegt bewusst in einer Routengruppe und nicht im Wurzel-Layout, damit die
 * Zugangsseite (/zugang) ohne Navigation und ohne Logo-Upload auskommt.
 * Routengruppen ändern die URLs nicht — /pflanzen bleibt /pflanzen.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
