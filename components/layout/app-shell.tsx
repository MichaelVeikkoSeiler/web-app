import { BottomNav } from "./bottom-nav";
import { TopHeader } from "./top-header";
import { getSiteSettings } from "@/lib/actions/settings";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { logoUrl } = await getSiteSettings();

  return (
    <>
      <TopHeader logoUrl={logoUrl} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 sm:px-8 sm:pb-12 sm:pt-8">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
