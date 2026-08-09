import { Leaf, MapPinned, CloudSun, Sparkles } from "lucide-react";

export const navItems = [
  { href: "/zonen", label: "Zonen", icon: MapPinned },
  { href: "/pflanzen", label: "Pflanzen", icon: Leaf },
  { href: "/wetter", label: "Wetter", icon: CloudSun },
  { href: "/besonderheiten", label: "Speziell", icon: Sparkles },
] as const;
