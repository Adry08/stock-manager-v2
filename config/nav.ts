// config/nav.ts
import { Home, Package, Truck, Archive, History, Settings } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

// Navigation pour Mobile (généralement moins d'items pour économiser l'espace)
export const NAV_ITEMS_MOBILE: NavItem[] = [
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Transit", href: "/livraison", icon: Truck },
  { label: "Accueil", href: "/dashboard", icon: Home }, // <-- Maintenant en 3ème position
  { label: "Vendus", href: "/vendu", icon: Archive },
  { label: "Historique", href: "/historique", icon: History },
];

// Navigation pour Desktop (peut inclure plus d'items)
export const NAV_ITEMS_DESKTOP: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: Home },
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Transit", href: "/livraison", icon: Truck },
  { label: "Vendus", href: "/vendu", icon: Archive },
  { label: "Historique", href: "/historique", icon: History },
];

// Item Settings séparé (souvent traité différemment dans les navbars)
export const SETTINGS_ITEM: NavItem = {
  label: "Paramètres",
  href: "/parametres",
  icon: Settings,
};