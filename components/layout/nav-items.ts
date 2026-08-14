import { Leaf, MapPinned, Stethoscope, LayoutGrid } from "lucide-react";

export const navItems = [
  { href: "/pflanzen", label: "Pflanzen", icon: Leaf },
  { href: "/zonen", label: "Zonen", icon: MapPinned },
  { href: "/plant-doc", label: "Plant Doc", icon: Stethoscope },
  { href: "/divers", label: "Divers", icon: LayoutGrid },
] as const;
