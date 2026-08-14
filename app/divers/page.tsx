import Link from "next/link";
import { ChevronRight, CloudSun, HelpCircle, Sparkles } from "lucide-react";
import {
  getDiversHeroImageUrl,
  setDiversHeroImage,
  clearDiversHeroImage,
} from "@/lib/actions/settings";
import { HeroBanner } from "@/components/layout/hero-banner";

const themes = [
  { href: "/wetter", label: "Wetter", icon: CloudSun },
  { href: "/besonderheiten", label: "Speziell", icon: Sparkles },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
];

export default async function DiversPage() {
  const heroImageUrl = await getDiversHeroImageUrl();

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Divers"
        uploadLabel="Bild hochladen"
        onUpload={setDiversHeroImage}
        onDelete={clearDiversHeroImage}
      />

      <h1 className="font-display text-2xl text-forest">Divers</h1>

      <div className="flex flex-col gap-2">
        {themes.map(({ href, label, icon: Icon }) => (
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
