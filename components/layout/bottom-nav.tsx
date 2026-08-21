"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { navItems } from "./nav-items";
import { playNavTapSound, playPlantDocSound, playZonenSound, playTiereSound } from "@/lib/sounds";

const tabSounds: Record<string, () => void> = {
  "/plant-doc": playPlantDocSound,
  "/zonen": playZonenSound,
  "/tiere": playTiereSound,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-warm-white/95 backdrop-blur sm:hidden">
      <div className="relative mx-auto flex max-w-lg items-center justify-around px-2 pt-2">
        {navItems.map((item) => (
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
      onClick={() => (tabSounds[href] ?? playNavTapSound)()}
      className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "text-forest" : "text-forest-muted"
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
      {label}
    </Link>
  );
}
