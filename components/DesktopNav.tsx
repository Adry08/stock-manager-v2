// components/DesktopNav.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Vérifiez que ce chemin est correct après l'installation
import { LogOut } from "lucide-react";
import clsx from "clsx";
import type { NavItem } from "@/config/nav";
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface DesktopNavProps {
  logout: () => void;
  pathname: string;
  username: string;
  navItems: NavItem[];
  settingsItem: NavItem;
}

const hrefToPage = {
  "/dashboard": "dashboard",
  "/stock": "stock",
  "/livraison": "livraison",
  "/vendu": "vendu",
  "/historique": "historique",
  "/parametres": "parametres",
} as const;

export function DesktopNav({ logout, pathname, username, navItems, settingsItem }: DesktopNavProps) {
  const { getPageColors, setCurrentPage } = useTheme();
  const allNavItems = [...navItems, settingsItem];
  const navRef = useRef<HTMLDivElement>(null);
  const itemLabelRefs = useRef<(HTMLSpanElement | null)[]>([]); // Références pour les textes (span)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const currentPage = (hrefToPage[pathname as keyof typeof hrefToPage] || "dashboard") as any;
  const colors = getPageColors(currentPage);

  useEffect(() => {
    setCurrentPage(currentPage);
  }, [pathname, currentPage, setCurrentPage]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = allNavItems.findIndex(item => item.href === pathname);
      const activeLabelEl = itemLabelRefs.current[activeIndex]; // On cible le <span> actif
      
      if (activeLabelEl && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const labelRect = activeLabelEl.getBoundingClientRect(); // On récupère les dimensions du texte
        setIndicatorStyle({
          left: labelRect.left - navRect.left, // Position relative à la barre de nav
          width: labelRect.width,           // Largeur du texte
          opacity: 1,
        });
      }
    };

    const timeoutId = setTimeout(updateIndicator, 100);
    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [pathname, allNavItems]);

  const primaryClass = colors?.primary || 'bg-blue-600';

  return (
    <nav className="hidden md:flex bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700 px-6 py-2 justify-between items-center sticky top-0 w-full z-50">
      <div className="flex items-center gap-1 relative" ref={navRef}>
        {allNavItems.map((item, index) => {
          const isActive = pathname === item.href;
          const itemPage = (hrefToPage[item.href as keyof typeof hrefToPage] || "dashboard") as any;
          const itemColors = getPageColors(itemPage);

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium relative z-10",
                isActive 
                  ? `${itemColors?.accent || 'text-blue-600'}` 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 active:scale-95"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span ref={(el) => { itemLabelRefs.current[index] = el; }}>{item.label}</span>
            </Link>
          );
        })}
        
        <div
          className={`absolute bottom-[6px] h-[3px] ${primaryClass} transition-all duration-500 ease-in-out rounded-full`}
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${primaryClass} flex items-center justify-center shadow-md`}>
            <span className="text-white font-semibold text-sm">{username.charAt(0).toUpperCase()}</span>
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">{username}</span>
        </div>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={logout} 
                      className="text-gray-500 hover:text-red-500 hover:bg-red-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-full"
                    >
                      <LogOut className="w-5 h-5" /> 
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Déconnexion</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
}