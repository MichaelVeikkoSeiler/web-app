import { Leaf, MapPinned, CloudSun, Sparkles, Stethoscope } from "lucide-react";

export const navItems = [
  { href: "/pflanzen", label: "Pflanzen", icon: Leaf },
  { href: "/zonen", label: "Zonen", icon: MapPinned },
  { href: "/besonderheiten", label: "Speziell", icon: Sparkles },
  { href: "/plant-doc", label: "Plant Doc", icon: Stethoscope },
  { href: "/wetter", label: "Wetter", icon: CloudSun },
] as const;
