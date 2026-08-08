"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, type LucideIcon } from "lucide-react";
import { navItems } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-warm-white/95 backdrop-blur sm:hidden">
      <div className="relative mx-auto flex max-w-lg items-center justify-around px-2 pt-2">
        {navItems.slice(0, 1).map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}

        <Link
          href="/pflanzen/neu"
          aria-label="Pflanze hinzufügen"
          className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-warm-white shadow-lg shadow-forest/20 transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Link>

        {navItems.slice(1).map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "text-forest" : "text-forest-muted"
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
      {label}
    </Link>
  );
}
