import { Leaf, MapPinned, CloudSun } from "lucide-react";

export const navItems = [
  { href: "/zonen", label: "Zonen", icon: MapPinned },
  { href: "/pflanzen", label: "Pflanzen", icon: Leaf },
  { href: "/wetter", label: "Wetter", icon: CloudSun },
] as const;
