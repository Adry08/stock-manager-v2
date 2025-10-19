// components/MobileNav.tsx
"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { NavItem } from "@/config/nav";
import { getPageColors } from "@/config/nav";
import { useEffect, useState, useRef } from "react";

interface MobileNavProps {
  logout: () => void;
  pathname: string;
  username: string;
  navItems: NavItem[];
}

export function MobileNav({ logout, pathname, username, navItems }: MobileNavProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const colors = getPageColors(pathname);

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.href === pathname);
    const activeItemEl = itemRefs.current[activeIndex];

    if (activeIndex !== -1 && activeItemEl && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItemEl.getBoundingClientRect();

      setIndicatorStyle({
        // CORRIGÉ : On utilise la position left de l'élément, pas son centre
        left: itemRect.left - navRect.left,
        width: itemRect.width,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prevStyle) => ({
        ...prevStyle,
        opacity: 0,
      }));
    }
  }, [pathname, navItems]);

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
    <>
      {/* Barre du haut */}
      <nav className="md:hidden fixed top-0 left-0 w-full z-40 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex justify-between items-center">
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
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-50 text-sm leading-tight">
                {username}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Bienvenue
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/parametres"
              className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all active:scale-95 border border-gray-200 dark:border-gray-800"
            >
              <Settings className="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
            </Link>
            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 flex items-center justify-center transition-all active:scale-95 border border-red-200 dark:border-red-900"
            >
              <LogOut className="w-[18px] h-[18px] text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </nav>

      {/* CORRIGÉ : Hauteur ajustée à 61px pour inclure la bordure de 1px */}
      <div className="md:hidden" style={{ height: "61px" }} />

      {/* Barre du bas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="px-4 pb-4">
          <div
            ref={navRef}
            className="relative flex items-center justify-around px-3 py-2.5 bg-white dark:bg-gray-950 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-gray-800"
          >
            {/* Indicateur circulaire animé */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-lg"
              initial={false}
              animate={{
                // CORRIGÉ : Animation sur 'left' au lieu de 'x'
                left: indicatorStyle.left,
                opacity: indicatorStyle.opacity,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 380, 
                damping: 30,
                mass: 0.8
              }}
              style={{ 
                width: "48px",
                height: "48px",
                // CORRIGÉ : Suppression du marginLeft négatif
                // marginLeft: "-24px",
                background: `linear-gradient(135deg, ${bgColors.light}, ${bgColors.dark})`,
              }}
            />

            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className="relative z-10 flex items-center justify-center w-12 h-12"
                >
                  <item.icon
                    className={clsx(
                      "transition-all duration-300",
                      isActive 
                        ? "w-6 h-6 text-white" 
                        : "w-5 h-5 text-gray-400 dark:text-gray-500"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      
    </>
  );
}