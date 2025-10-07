// components/Navbar.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from 'next/navigation';
import { NAV_ITEMS_MOBILE, NAV_ITEMS_DESKTOP, SETTINGS_ITEM } from '@/config/nav'; 
import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

// Mapping des hrefs vers les pages du thème
const hrefToPage = {
  "/dashboard": "dashboard",
  "/stock": "stock",
  "/livraison": "livraison",
  "/vendu": "vendu",
  "/historique": "historique",
  "/parametres": "parametres",
} as const;

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { setCurrentPage } = useTheme();

  // Mettre à jour la page courante dans le contexte de thème
  useEffect(() => {
    const currentPage = hrefToPage[pathname as keyof typeof hrefToPage] || "dashboard";
    setCurrentPage(currentPage as any);
  }, [pathname, setCurrentPage]);

  // Ne pas afficher la navbar sur login ou si pas connecté
  if (!user || pathname === "/login" || pathname === "/") {
    return null;
  }

  // L'objet user a au minimum une propriété email
  const username = user.email.split('@')[0];

  // Propriétés communes à la navigation Mobile et Desktop
  const commonProps = {
    logout,
    pathname,
    username,
    settingsItem: SETTINGS_ITEM,
  };

  return (
    <>
      {/* 1. Navigation Mobile : Utilise la liste NAV_ITEMS_MOBILE */}
      <MobileNav 
        {...commonProps} 
        user={user} 
        navItems={NAV_ITEMS_MOBILE}
      />
      
      {/* 2. Navigation Desktop : Utilise la liste NAV_ITEMS_DESKTOP */}
      <DesktopNav 
        {...commonProps} 
        navItems={NAV_ITEMS_DESKTOP}
      />
    </>
  );
}