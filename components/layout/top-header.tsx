"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudSun, Plus } from "lucide-react";
import { navItems } from "./nav-items";
import { LogoUpload } from "./logo-upload";

export function TopHeader({ logoUrl }: { logoUrl: string | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-warm-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-3">
          <LogoUpload initialUrl={logoUrl} />
          <Link href="/" className="font-display text-lg text-forest sm:text-xl">
            Seilers Garten
          </Link>
        </div>

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

        <Link
          href="/pflanzen/neu"
          className="hidden items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-forest shadow-sm transition-colors hover:bg-sage-dark hover:text-warm-white sm:flex"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Pflanze hinzufügen
        </Link>

        <Link
          href="/wetter"
          aria-label="Wetter"
          className={`flex h-10 w-10 items-center justify-center rounded-full sm:hidden ${
            pathname.startsWith("/wetter")
              ? "bg-sage/40 text-forest"
              : "text-forest-muted hover:bg-sage/20"
          }`}
        >
          <CloudSun className="h-5 w-5" strokeWidth={pathname.startsWith("/wetter") ? 2.25 : 1.75} />
        </Link>
      </div>
    </header>
  );
}
