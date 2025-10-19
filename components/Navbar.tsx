// components/Navbar.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from 'next/navigation';
import { NAV_ITEMS_MOBILE, NAV_ITEMS_DESKTOP, SETTINGS_ITEM } from '@/config/nav'; 
import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

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
      {/* Navigation Mobile */}
      <MobileNav 
        {...commonProps} 
        navItems={NAV_ITEMS_MOBILE}
      />
      
      {/* Navigation Desktop */}
      <DesktopNav 
        {...commonProps} 
        navItems={NAV_ITEMS_DESKTOP}
      />
    </>
  );
}