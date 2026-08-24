import Image from "next/image";
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

        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <Image
            src="/images/soil-mound.png"
            alt=""
            width={1536}
            height={289}
            className="mt-6 block h-auto w-full sm:hidden"
          />
          <Image
            src="/images/soil-mound-desktop.png"
            alt=""
            width={2172}
            height={724}
            className="mt-6 hidden h-auto w-full sm:block"
          />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
