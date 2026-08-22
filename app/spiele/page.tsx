import Link from "next/link";
import { ChevronRight, HelpCircle, Swords, Search } from "lucide-react";

const games = [
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/spiele/pflanzen-match", label: "Pflanzen-Match", icon: Swords },
  { href: "/spiele/detektiv", label: "Detektiv", icon: Search },
];

export default function SpielePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Spiele</h1>

      <div className="flex flex-col gap-2">
        {games.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-warm-white px-4 py-3 hover:shadow-md"
          >
            <Icon className="h-4 w-4 shrink-0 text-forest-muted" />
            <span className="flex-1 font-display text-base text-forest">{label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-forest-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
