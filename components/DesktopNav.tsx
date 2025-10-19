// components/DesktopNav.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import type { NavItem } from "@/config/nav";
import { getPageColors } from "@/config/nav";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";

interface DesktopNavProps {
  logout: () => void;
  pathname: string;
  username: string;
  navItems: NavItem[];
  settingsItem: NavItem;
}

export function DesktopNav({ logout, pathname, username, navItems, settingsItem }: DesktopNavProps) {
  const allNavItems = useMemo(() => [...navItems, settingsItem], [navItems, settingsItem]);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const colors = getPageColors(pathname);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = allNavItems.findIndex(item => item.href === pathname);
      const activeItemEl = itemRefs.current[activeIndex];
      
      if (activeIndex !== -1 && activeItemEl && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = activeItemEl.getBoundingClientRect();
        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    // Délai plus long pour s'assurer que le DOM est prêt
    const timeoutId = setTimeout(updateIndicator, 150);
    
    // Forcer une mise à jour après le premier rendu
    requestAnimationFrame(() => {
      requestAnimationFrame(updateIndicator);
    });
    
    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [pathname, allNavItems]);

  // Convertir la couleur Tailwind en style inline pour dark mode
  const getBackgroundColor = () => {
    const colorMap: Record<string, { light: string; dark: string }> = {
      "bg-indigo-600": { light: "#4f46e5", dark: "#6366f1" },
      "bg-blue-600": { light: "#2563eb", dark: "#3b82f6" },
      "bg-orange-600": { light: "#ea580c", dark: "#f97316" },
      "bg-green-600": { light: "#16a34a", dark: "#22c55e" },
      "bg-purple-600": { light: "#9333ea", dark: "#a855f7" },
      "bg-gray-600": { light: "#4b5563", dark: "#6b7280" },
    };
    return colorMap[colors.primary] || { light: "#2563eb", dark: "#3b82f6" };
  };

  const bgColors = getBackgroundColor();

  return (
    <nav className="hidden md:flex bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-6 lg:px-8 py-4 justify-between items-center sticky top-0 w-full z-50">
      {/* Navigation Links */}
      <div className="flex items-center gap-2 relative pb-2" ref={navRef}>
        {allNavItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative z-10"
            >
              <div
                ref={(el) => { itemRefs.current[index] = el; }}
                className={clsx(
                  "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium group",
                  isActive 
                    ? "text-gray-900 dark:text-gray-50 bg-gray-50 dark:bg-gray-900" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                )}
              >
                <item.icon 
                  className={clsx(
                    "transition-all duration-300",
                    isActive ? "w-5 h-5" : "w-[18px] h-[18px] group-hover:w-5 group-hover:h-5"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="hidden lg:inline whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Indicateur animé sous l'élément actif */}
        <motion.div
          className="absolute bottom-0 left-0 h-[3px] rounded-full z-20"
          initial={false}
          animate={{
            x: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 380, 
            damping: 30 
          }}
          style={{
            background: `linear-gradient(90deg, ${bgColors.light}, ${bgColors.dark})`,
          }}
        />
      </div>

      {/* User Info & Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div 
            style={{
              background: `linear-gradient(135deg, ${bgColors.light}, ${bgColors.dark})`,
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md ring-1 ring-gray-100 dark:ring-gray-800"
          >
            <span className="text-white font-bold text-sm">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden lg:block">
            <div className="font-semibold text-gray-900 dark:text-gray-50 text-sm leading-tight">
              {username}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              Connecté
            </div>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost"
                size="icon"
                onClick={logout} 
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950 rounded-xl transition-all w-9 h-9 border border-transparent hover:border-red-200 dark:hover:border-red-900"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={2} /> 
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