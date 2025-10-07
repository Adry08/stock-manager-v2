// components/MobileNav.tsx
"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { NavItem } from "@/config/nav";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState, useRef } from "react";
import tinycolor from "tinycolor2";

interface MobileNavProps {
  logout: () => void;
  pathname: string;
  username: string;
  navItems: NavItem[];
}

const hrefToPage = {
  "/dashboard": "dashboard",
  "/stock": "stock",
  "/livraison": "livraison",
  "/vendu": "vendu",
  "/historique": "historique",
  "/parametres": "parametres",
} as const;

export function MobileNav({ logout, pathname, username, navItems }: MobileNavProps) {
  const { getPageColors, setCurrentPage } = useTheme();
  // Ajout de 'opacity' à l'état initial pour gérer l'affichage/disparition
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, color: '#3b82f6', opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const currentPage = (hrefToPage[pathname as keyof typeof hrefToPage] || "dashboard") as any;
  const colors = getPageColors(currentPage);

  useEffect(() => {
    setCurrentPage(currentPage);
  }, [pathname, currentPage, setCurrentPage]);

  // Convertir une classe Tailwind en code HEX
  const tailwindColorToHex = (className: string = 'bg-blue-600') => {
    const colorMap: Record<string, string> = {
      'bg-indigo-600': '#4f46e5',
      'bg-blue-600': '#2563eb',
      'bg-orange-600': '#ea580c',
      'bg-green-600': '#16a34a',
      'bg-purple-600': '#9333ea',
      'bg-gray-600': '#4b5563',
    };
    return colorMap[className] || '#2563eb';
  };
  
  // Ce useEffect gère maintenant tous les cas de figure
  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.href === pathname);
    const activeItemEl = itemRefs.current[activeIndex];
    
    // Si une icône est active dans la barre
    if (activeIndex !== -1 && activeItemEl && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItemEl.getBoundingClientRect();
      
      // On récupère la couleur directement à partir de la page active
      const activePage = (hrefToPage[pathname as keyof typeof hrefToPage] || "dashboard") as any;
      const pageColors = getPageColors(activePage);
      const newColor = tailwindColorToHex(pageColors?.primary);

      setIndicatorStyle({
        left: itemRect.left - navRect.left,
        width: itemRect.width,
        color: newColor,
        opacity: 1, // On le rend visible
      });
    } else { // Si aucune icône n'est active (ex: /parametres)
      setIndicatorStyle(prevStyle => ({
        ...prevStyle,
        opacity: 0, // On le rend invisible
      }));
    }
  }, [pathname, navItems, getPageColors]);


  const gradientClass = colors?.primary ? `from-${colors.primary.split('-')[1]}-500 to-${colors.primary.split('-')[1]}-600` : 'from-blue-500 to-blue-600';
  
  return (
    <>
      {/* Barre du HAUT */}
      <nav className="md:hidden fixed top-0 left-0 w-full z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md`}>
              <span className="text-white font-bold text-sm">{username.charAt(0).toUpperCase()}</span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/parametres" 
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 flex items-center justify-center transition-all active:scale-95"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <button 
              onClick={logout} 
              className="w-9 h-9 rounded-full bg-red-100/80 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Espaceur pour pousser le contenu de la page */}
      <div className="md:hidden" style={{ height: '61px' }} />

      {/* Barre du BAS : Navigation flottante */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)]">
        <div ref={navRef} className="relative flex items-center gap-x-1 p-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-full shadow-lg border border-white/50 dark:border-gray-700/50">
          <AnimatePresence>
            <motion.div
              className="absolute h-[48px] rounded-full shadow-md"
              initial={false}
              animate={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                backgroundColor: indicatorStyle.color,
                opacity: indicatorStyle.opacity,
              }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
              style={{ top: '6px' }}
            />
          </AnimatePresence>

          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                ref={(el) => { itemRefs.current[index] = el; }}
                className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
              >
                <item.icon 
                  className={clsx(
                    "w-6 h-6 transition-colors duration-300", 
                    isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                  )} 
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}