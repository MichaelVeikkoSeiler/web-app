"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { LogoUpload } from "./logo-upload";
import { SiteSearch } from "./site-search";

export function TopHeader({ logoUrl }: { logoUrl: string | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-warm-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-3">
          <LogoUpload initialUrl={logoUrl} />
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-display text-[23px] text-forest sm:text-[25px]">HORTTIA</span>
            <span className="hidden text-[18px] text-forest-muted md:inline">– by Veikko</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-sage/40 text-forest" : "text-forest-muted hover:bg-sage/20"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <SiteSearch />
        </div>
      </div>
    </header>
  );
}
