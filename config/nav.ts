// config/nav.ts
import { Home, Package, Truck, Archive, History, Settings } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

// Configuration centralisée des couleurs par page
export const PAGE_COLORS = {
  dashboard: {
    primary: "bg-indigo-600",
    primaryHover: "bg-indigo-700",
    accent: "text-indigo-600",
    accentDark: "text-indigo-400",
    gradient: "from-indigo-500 to-indigo-600",
    light: "bg-indigo-50",
    lightDark: "bg-indigo-900/20",
    border: "border-indigo-200",
    borderDark: "border-indigo-800",
    hex: "#4f46e5",
  },
  stock: {
    primary: "bg-blue-600",
    primaryHover: "bg-blue-700",
    accent: "text-blue-600",
    accentDark: "text-blue-400",
    gradient: "from-blue-500 to-blue-600",
    light: "bg-blue-50",
    lightDark: "bg-blue-900/20",
    border: "border-blue-200",
    borderDark: "border-blue-800",
    hex: "#2563eb",
  },
  livraison: {
    primary: "bg-orange-600",
    primaryHover: "bg-orange-700",
    accent: "text-orange-600",
    accentDark: "text-orange-400",
    gradient: "from-orange-500 to-orange-600",
    light: "bg-orange-50",
    lightDark: "bg-orange-900/20",
    border: "border-orange-200",
    borderDark: "border-orange-800",
    hex: "#ea580c",
  },
  vendu: {
    primary: "bg-green-600",
    primaryHover: "bg-green-700",
    accent: "text-green-600",
    accentDark: "text-green-400",
    gradient: "from-green-500 to-green-600",
    light: "bg-green-50",
    lightDark: "bg-green-900/20",
    border: "border-green-200",
    borderDark: "border-green-800",
    hex: "#16a34a",
  },
  historique: {
    primary: "bg-purple-600",
    primaryHover: "bg-purple-700",
    accent: "text-purple-600",
    accentDark: "text-purple-400",
    gradient: "from-purple-500 to-purple-600",
    light: "bg-purple-50",
    lightDark: "bg-purple-900/20",
    border: "border-purple-200",
    borderDark: "border-purple-800",
    hex: "#9333ea",
  },
  parametres: {
    primary: "bg-gray-600",
    primaryHover: "bg-gray-700",
    accent: "text-gray-600",
    accentDark: "text-gray-400",
    gradient: "from-gray-500 to-gray-600",
    light: "bg-gray-50",
    lightDark: "bg-gray-900/20",
    border: "border-gray-200",
    borderDark: "border-gray-800",
    hex: "#4b5563",
  },
} as const;

// Mapping des hrefs vers les pages
export const HREF_TO_PAGE = {
  "/dashboard": "dashboard",
  "/stock": "stock",
  "/livraison": "livraison",
  "/vendu": "vendu",
  "/historique": "historique",
  "/parametres": "parametres",
} as const;

// Navigation pour Mobile
export const NAV_ITEMS_MOBILE: NavItem[] = [
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Transit", href: "/livraison", icon: Truck },
  { label: "Accueil", href: "/dashboard", icon: Home },
  { label: "Vendus", href: "/vendu", icon: Archive },
  { label: "Historique", href: "/historique", icon: History },
];

// Navigation pour Desktop
export const NAV_ITEMS_DESKTOP: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: Home },
  { label: "Stock", href: "/stock", icon: Package },
  { label: "Transit", href: "/livraison", icon: Truck },
  { label: "Vendus", href: "/vendu", icon: Archive },
  { label: "Historique", href: "/historique", icon: History },
];

// Item Settings séparé
export const SETTINGS_ITEM: NavItem = {
  label: "Paramètres",
  href: "/parametres",
  icon: Settings,
};

// Fonction utilitaire pour obtenir les couleurs d'une page
export function getPageColors(pathname: string) {
  const page = HREF_TO_PAGE[pathname as keyof typeof HREF_TO_PAGE] || "dashboard";
  return PAGE_COLORS[page];
}