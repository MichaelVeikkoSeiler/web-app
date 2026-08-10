import { Leaf, MapPinned, CloudSun, Sparkles, Stethoscope } from "lucide-react";

export const navItems = [
  { href: "/zonen", label: "Zonen", icon: MapPinned },
  { href: "/pflanzen", label: "Pflanzen", icon: Leaf },
  { href: "/wetter", label: "Wetter", icon: CloudSun },
  { href: "/besonderheiten", label: "Speziell", icon: Sparkles },
  { href: "/plant-doc", label: "Plant Doc", icon: Stethoscope },
] as const;
